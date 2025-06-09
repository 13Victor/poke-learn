/**
 * Rutas para sistema de batallas Pokémon
 */
const express = require("express");
const { BattleStream, Teams } = require("pokemon-showdown");
const { formatResponse } = require("../utils/helpers");
const { errorMessages } = require("../utils/messages");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Almacenar batallas activas
const activeBattles = new Map();

/**
 * @route POST /battle/start
 * @desc Iniciar una nueva batalla
 */
router.post("/start", verifyToken, async (req, res) => {
  try {
    const {
      format = "gen9ou",
      playerTeam = null,
      rivalTeamExport = null,
      useCustomTeams = false,
      difficulty = "easy",
    } = req.body;

    const battleId = Date.now().toString();

    let finalPlayerTeam, finalAiTeam;

    if (useCustomTeams && playerTeam && rivalTeamExport) {
      console.log("🎯 Using custom teams for battle");

      // Player team is already in JSON format
      finalPlayerTeam = Teams.pack(playerTeam);

      // Convert rival team from export format to packed format
      try {
        const rivalTeamJson = Teams.import(rivalTeamExport);
        finalAiTeam = Teams.pack(rivalTeamJson);

        console.log("✅ Custom teams processed successfully");
        console.log("Player team (packed):", finalPlayerTeam);
        console.log("AI team (packed):", finalAiTeam);
      } catch (error) {
        console.error("❌ Error processing rival team:", error);
        throw new Error("Error al procesar el equipo rival: " + error.message);
      }
    } else {
      console.log("🎲 Using random teams for battle");
      // Generate random teams as before
      finalPlayerTeam = Teams.pack(Teams.generate(format));
      finalAiTeam = Teams.pack(Teams.generate(format));
    }

    const battleSetup = {
      battleId,
      format,
      playerTeam: finalPlayerTeam,
      aiTeam: finalAiTeam,
      logs: [],
      state: "setup",
      lastInputTurn: 0,
      useCustomTeams,
      difficulty, // Store difficulty level
      aiState: {
        pendingAction: null,
        availablePokemon: [], // Keep track of CPU's available pokemon
        needsToSwitch: false,
      },
    };

    activeBattles.set(battleId, battleSetup);

    res.json(
      formatResponse(true, "Batalla creada correctamente", {
        battleId,
        format,
        useCustomTeams,
        difficulty,
      })
    );
  } catch (error) {
    console.error("Error al iniciar batalla:", error);
    res.status(500).json(formatResponse(false, "Error al iniciar batalla: " + error.message));
  }
});

/**
 * @route POST /battle/initialize/:battleId
 * @desc Iniciar la batalla y recibir el estado inicial
 */
router.post("/initialize/:battleId", verifyToken, async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);
    console.log("Dificultad enviada al frontend:", battle.difficulty);
    if (!battle) {
      return res.status(404).json(formatResponse(false, "Batalla no encontrada"));
    }

    // Crear stream de batalla
    const battleStream = new BattleStream();

    // Guardar referencia al stream de batalla
    battle.stream = battleStream;
    battle.state = "active";
    battle.logs = [];
    battle.turnCount = 0;
    battle.pendingCommands = [];
    battle.teamPreviewPhase = true; // Add team preview phase flag
    battle.waitingForCPUAction = false; // Flag to track if we're waiting for CPU action

    // Manejar la salida del stream
    const streamHandler = async () => {
      for await (const chunk of battleStream) {
        console.log("Mensaje del simulador:", chunk);
        battle.logs.push(chunk);

        // Detectar el final de team preview
        if (chunk.includes("|start")) {
          battle.teamPreviewPhase = false;
          console.log("🚀 Team preview finalizado, batalla iniciada");
        }

        // Detectar el inicio de un nuevo turno
        if (chunk.includes("|turn|")) {
          const turnMatch = chunk.match(/\|turn\|(\d+)/);
          if (turnMatch && turnMatch[1]) {
            battle.turnCount = parseInt(turnMatch[1], 10);
            console.log(`Turno ${battle.turnCount} detectado`);
          }
        }

        // NUEVO: Detectar automáticamente cuando la CPU necesita hacer algo
        if (chunk.includes("sideupdate") && chunk.includes("p2") && chunk.includes("|request|")) {
          console.log("🤖 Detectado request para la CPU, procesando automáticamente...");

          // Procesar automáticamente la acción de la CPU después de un breve delay
          setTimeout(async () => {
            try {
              await handleAutomaticCPUAction(battle);
            } catch (error) {
              console.error("Error en acción automática de CPU:", error);
            }
          }, 1500); // Delay para asegurar que el log se procese completamente
        }

        // Si la batalla ha terminado, actualizamos el estado
        if (chunk.includes("|win|") || chunk.includes("|tie|")) {
          battle.state = "completed";
          battle.teamPreviewPhase = false;
        }
      }
    };

    // Ejecutamos el handler pero no esperamos que termine para continuar
    streamHandler().catch((error) => {
      console.error("Error en el stream de batalla:", error);
      battle.logs.push(`ERROR: ${error.message}`);
    });

    // Inicializar la batalla con opciones explícitas
    console.log("Iniciando batalla...");
    await battleStream.write(`>start {"formatid":"${battle.format}"}`);
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log("Configurando jugador 1...");
    await battleStream.write(
      `>player p1 {"name":"${req.user.user_name}","avatar":"${req.user.profile_picture}","team":${JSON.stringify(
        battle.playerTeam
      )}}`
    );
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log("Configurando jugador 2...");
    const cpuName = `${battle.difficulty.charAt(0).toUpperCase() + battle.difficulty.slice(1)} CPU`; // Formatear dificultad
    await battleStream.write(`>player p2 {"name":"${cpuName}","team":${JSON.stringify(battle.aiTeam)}}`);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    res.json(
      formatResponse(true, "Batalla inicializada correctamente", {
        battleId,
        logs: battle.logs,
        state: battle.state,
        turnCount: battle.turnCount,
        teamPreviewPhase: battle.teamPreviewPhase,
        difficulty: battle.difficulty, // Asegúrate de incluir la dificultad aquí
      })
    );
  } catch (error) {
    console.error("Error al inicializar batalla:", error);
    res.status(500).json(formatResponse(false, "Error al inicializar batalla: " + error.message));
  }
});

/**
 * NUEVA FUNCIÓN: Manejar automáticamente las acciones de la CPU
 */
async function handleAutomaticCPUAction(battle) {
  if (!battle.stream || battle.state !== "active" || battle.waitingForCPUAction) {
    return; // Evitar múltiples ejecuciones simultáneas
  }

  battle.waitingForCPUAction = true;

  try {
    console.log("🤖 Procesando acción automática de la CPU...");

    // Obtener los datos de request más recientes para la CPU
    const cpuRequestData = parseLatestRequestData(battle.logs, "p2");

    if (!cpuRequestData) {
      console.log("⚠️ No se encontraron datos de request para la CPU");
      battle.waitingForCPUAction = false;
      return;
    }

    console.log("📋 Datos de request de CPU:", JSON.stringify(cpuRequestData, null, 2));

    let cpuCommand = null;

    // Verificar si la CPU necesita cambiar de Pokémon (forzado)
    if (cpuRequestData.forceSwitch && cpuRequestData.forceSwitch[0]) {
      console.log("🔄 CPU forzada a cambiar de Pokémon");

      const availablePokemon = cpuRequestData.side?.pokemon || [];
      console.log(
        "🎯 Pokémon disponibles para CPU:",
        availablePokemon.map((p) => `${p.details} (${p.condition})`)
      );

      // Encontrar un Pokémon viable para cambiar
      const viablePokemon = availablePokemon.filter(
        (pokemon, index) => !pokemon.condition.includes("fnt") && !pokemon.active
      );

      console.log(
        "✅ Pokémon viables para cambio:",
        viablePokemon.map((p) => p.details)
      );

      if (viablePokemon.length > 0) {
        // Seleccionar aleatoriamente uno de los Pokémon viables
        const randomIndex = Math.floor(Math.random() * viablePokemon.length);
        const selectedPokemon = viablePokemon[randomIndex];

        // Encontrar el índice original del Pokémon seleccionado (1-based)
        const originalIndex = availablePokemon.findIndex((pokemon) => pokemon.details === selectedPokemon.details) + 1;

        cpuCommand = `>p2 switch ${originalIndex}`;
        console.log(`🎲 CPU cambiando a slot ${originalIndex}: ${selectedPokemon.details.split(",")[0]}`);
      } else {
        console.log("❌ No hay Pokémon viables para cambiar, usando slot 2 por defecto");
        cpuCommand = ">p2 switch 2";
      }
    }
    // Verificar si la CPU puede atacar
    else if (cpuRequestData.active && cpuRequestData.active[0] && cpuRequestData.active[0].moves) {
      console.log("⚔️ CPU puede atacar");

      const allMoves = cpuRequestData.active[0].moves;
      const enabledMoves = allMoves.filter((move) => !move.disabled);

      if (enabledMoves.length > 0) {
        const moveSlot = getAIMove(battle, allMoves);
        cpuCommand = `>p2 move ${moveSlot}`;
        console.log(`🎯 CPU atacando con movimiento slot ${moveSlot}`);
      } else {
        console.log("⚠️ No hay movimientos habilitados, CPU usará primer slot");
        cpuCommand = ">p2 move 1";
      }
    }
    // Team preview
    else if (battle.teamPreviewPhase) {
      console.log("🔍 CPU en team preview, enviando orden de equipo");
      cpuCommand = ">p2 team 123456";
    }

    // Ejecutar el comando si tenemos uno
    if (cpuCommand) {
      console.log(`🚀 Ejecutando comando automático de CPU: ${cpuCommand}`);

      battle.pendingCommands.push(cpuCommand);
      await battle.stream.write(cpuCommand);

      console.log("✅ Comando automático de CPU ejecutado exitosamente");
    } else {
      console.log("⚠️ No se pudo determinar qué acción debe tomar la CPU");
    }
  } catch (error) {
    console.error("❌ Error en acción automática de CPU:", error);
  } finally {
    battle.waitingForCPUAction = false;
  }
}

/**
 * Helper function to get a random AI move based on difficulty
 */
function getAIMove(battle, availableMoves = []) {
  const difficulty = battle.difficulty || "easy";

  console.log(`🤖 IA seleccionando movimiento para dificultad: ${difficulty}`);
  console.log(`🎯 Movimientos disponibles:`, availableMoves);

  // Filter only enabled moves
  const enabledMoves = availableMoves.filter((move) => !move.disabled);
  console.log(`✅ Movimientos habilitados: ${enabledMoves.length}`, enabledMoves);

  if (enabledMoves.length === 0) {
    console.log("❌ No hay movimientos habilitados, usando struggle");
    return 1; // Fallback to first move slot (will likely be Struggle)
  }

  // Get the actual slot numbers of enabled moves
  const enabledSlots = [];
  availableMoves.forEach((move, index) => {
    if (!move.disabled) {
      enabledSlots.push(index + 1); // Convert to 1-based index
    }
  });

  console.log(`🎰 Slots de movimientos habilitados: [${enabledSlots.join(", ")}]`);

  switch (difficulty) {
    case "easy":
      // For easy mode, select a random move from enabled moves
      const randomIndex = Math.floor(Math.random() * enabledSlots.length);
      const selectedMove = enabledSlots[randomIndex];
      console.log(
        `🎲 Modo fácil: seleccionando movimiento habilitado slot ${selectedMove} (${
          enabledMoves[randomIndex]?.move || "Unknown"
        })`
      );
      return selectedMove;

    case "medium":
      // For medium mode, select move with highest base power
      return getMostPowerfulMove(enabledMoves, enabledSlots);

    case "hard":
    default:
      // For hard mode, prefer the first enabled move (usually strongest available)
      const hardMove = enabledSlots[0];
      console.log(
        `🔥 Modo difícil: seleccionando primer movimiento habilitado slot ${hardMove} (${
          enabledMoves[0]?.move || "Unknown"
        })`
      );
      return hardMove;
  }
}

/**
 * Helper function to select the move with highest base power for medium difficulty
 */
function getMostPowerfulMove(enabledMoves, enabledSlots) {
  const data = require("../data/dataLoader");
  const moves = data.moves.Moves;

  let mostPowerfulSlot = enabledSlots[0];
  let highestPower = -1;
  let mostPowerfulMoveName = "Unknown";

  console.log(`⚡ Modo medio: analizando poder base de movimientos...`);

  enabledMoves.forEach((moveData, index) => {
    const moveName = moveData.move;
    const slot = enabledSlots[index];

    // Find move in data by name
    let basePower = 0;
    let moveId = null;

    // Search for move by name in the moves data
    for (const id in moves) {
      if (moves[id].name === moveName) {
        basePower = moves[id].basePower || 0;
        moveId = id;
        break;
      }
    }

    console.log(`🔍 Movimiento: ${moveName} (slot ${slot}) - Poder base: ${basePower}`);

    // Prioritize moves with higher base power
    // For status moves (basePower 0), we'll treat them as lowest priority
    if (basePower > highestPower) {
      highestPower = basePower;
      mostPowerfulSlot = slot;
      mostPowerfulMoveName = moveName;
    }
  });

  // If all moves have 0 base power (all status moves), select randomly
  if (highestPower === 0) {
    const randomIndex = Math.floor(Math.random() * enabledSlots.length);
    mostPowerfulSlot = enabledSlots[randomIndex];
    mostPowerfulMoveName = enabledMoves[randomIndex]?.move || "Unknown";
    console.log(
      `🎲 Todos los movimientos son de estado, seleccionando aleatoriamente: ${mostPowerfulMoveName} (slot ${mostPowerfulSlot})`
    );
  } else {
    console.log(
      `💥 Seleccionando movimiento más potente: ${mostPowerfulMoveName} (slot ${mostPowerfulSlot}) - Poder: ${highestPower}`
    );
  }

  return mostPowerfulSlot;
}

/**
 * Helper function to get a random AI switch when forced
 */
function getAISwitch(battle, availablePokemon = []) {
  const difficulty = battle.difficulty || "easy";

  console.log(`🔄 IA seleccionando cambio de Pokémon para dificultad: ${difficulty}`);

  // Filter out fainted pokemon and the current active one
  const viablePokemon = availablePokemon.filter(
    (pokemon, index) => !pokemon.condition.includes("fnt") && !pokemon.active
  );

  if (viablePokemon.length === 0) {
    console.log("❌ No hay Pokémon viables para cambiar");
    return 2; // Fallback to slot 2
  }

  // Get a random viable pokemon
  const randomIndex = Math.floor(Math.random() * viablePokemon.length);
  const selectedPokemon = viablePokemon[randomIndex];

  // Find the original index of this pokemon (1-based)
  const originalIndex = availablePokemon.findIndex((pokemon) => pokemon.details === selectedPokemon.details) + 1;

  console.log(`🎲 IA seleccionando cambio a slot ${originalIndex}: ${selectedPokemon.details.split(",")[0]}`);
  return originalIndex;
}

/**
 * Helper function to parse request data from battle logs to understand available moves
 */
function parseLatestRequestData(logs, player = "p2") {
  // Look for the most recent request messages for the specified player
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (typeof log === "string" && log.includes(`sideupdate\n${player}`) && log.includes("|request|")) {
      try {
        const lines = log.split("\n");
        for (const line of lines) {
          if (line.includes("|request|")) {
            const requestMatch = line.match(/\|request\|(.+)/);
            if (requestMatch) {
              const requestData = JSON.parse(requestMatch[1]);
              console.log(`🔍 Request data encontrada para ${player}:`, requestData);
              return requestData;
            }
          }
        }
      } catch (error) {
        console.error("Error parsing request data:", error);
      }
    }
  }
  return null;
}

/**
 * Helper function to determine what AI should do based on the game state
 */
function getAIAction(battle) {
  const cpuRequestData = parseLatestRequestData(battle.logs, "p2");

  if (!cpuRequestData) {
    console.log("🤖 No hay datos de request para la CPU, usando movimiento por defecto");
    return { type: "move", value: 1 }; // Fallback move
  }

  // Check if CPU is forced to switch (pokemon fainted)
  if (cpuRequestData.forceSwitch && cpuRequestData.forceSwitch[0]) {
    console.log("🔄 CPU forzada a cambiar de Pokémon");
    const availablePokemon = cpuRequestData.side?.pokemon || [];
    const switchSlot = getAISwitch(battle, availablePokemon);
    return { type: "switch", value: switchSlot };
  }

  // Check if CPU has active pokemon and can make moves
  if (cpuRequestData.active && cpuRequestData.active[0] && cpuRequestData.active[0].moves) {
    const allMoves = cpuRequestData.active[0].moves;
    console.log("🎯 Todos los movimientos de la CPU:", allMoves);

    // Filter only enabled moves
    const enabledMoves = allMoves.filter((move) => !move.disabled);
    console.log("✅ Movimientos habilitados para la CPU:", enabledMoves);

    if (enabledMoves.length > 0) {
      console.log("⚔️ CPU puede atacar con movimientos habilitados");
      const moveSlot = getAIMove(battle, allMoves); // Pass all moves, function will filter enabled ones
      return { type: "move", value: moveSlot };
    } else {
      console.log("⚠️ No hay movimientos habilitados, la CPU usará Struggle");
      return { type: "move", value: 1 }; // Will likely result in Struggle
    }
  }

  // Check if CPU can only switch (no moves available but has pokemon)
  if (cpuRequestData.side?.pokemon) {
    const availablePokemon = cpuRequestData.side.pokemon;
    const viablePokemon = availablePokemon.filter(
      (pokemon, index) => !pokemon.condition.includes("fnt") && !pokemon.active
    );

    if (viablePokemon.length > 0) {
      console.log("🔄 CPU no puede atacar, cambiando de Pokémon");
      const switchSlot = getAISwitch(battle, availablePokemon);
      return { type: "switch", value: switchSlot };
    }
  }

  // Default fallback - try to make a move
  console.log("🤖 CPU usando acción por defecto (primer movimiento)");
  return { type: "move", value: 1 };
}

/**
 * @route POST /battle/command/:battleId
 * @desc Enviar un comando a la batalla
 */
router.post("/command/:battleId", verifyToken, async (req, res) => {
  try {
    const { battleId } = req.params;
    let { command } = req.body;

    console.log(`Recibiendo comando para batalla ${battleId}:`, command);

    const battle = activeBattles.get(battleId);

    if (!battle || !battle.stream) {
      return res.status(404).json(formatResponse(false, "Batalla no encontrada"));
    }

    if (battle.state !== "active") {
      return res.status(400).json(formatResponse(false, "La batalla no está activa"));
    }

    // Guardar los logs actuales para encontrar los nuevos después
    const currentLogLength = battle.logs.length;
    const currentTurn = battle.turnCount || 0;

    // Normalizar el formato del comando (asegurarse que tenga ">" al principio)
    if (!command.startsWith(">")) {
      command = ">" + command;
    }

    console.log("Escribiendo comando al stream:", command);

    try {
      // Almacenar el comando ejecutado
      battle.pendingCommands.push(command);

      // Capturar longitud actual de logs antes del comando
      const preCommandLogLength = battle.logs.length;

      // Ejecutar el comando
      await battle.stream.write(command);

      // Esperar para que el comando se procese completamente
      // Team preview commands need less time
      const waitTime = command.includes("team") ? 1000 : 2000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Obtener los nuevos logs después del comando
      const newLogs = battle.logs.slice(preCommandLogLength);
      console.log(`Se generaron ${newLogs.length} nuevos logs después del comando:`, newLogs);

      // Handle team preview phase differently
      if (battle.teamPreviewPhase && command.includes("p1 team")) {
        console.log("🎯 Team preview command from player, CPU command will be handled automatically");

        // Wait for automatic CPU response
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Get all logs after both commands
        const allNewLogs = battle.logs.slice(preCommandLogLength);
        console.log(`Logs después de comandos de team preview: ${allNewLogs.length}`, allNewLogs);

        return res.json(
          formatResponse(true, "Comando de team preview ejecutado", {
            battleId,
            logs: allNewLogs,
            state: battle.state,
            turnCount: battle.turnCount,
            teamPreviewPhase: battle.teamPreviewPhase,
            debug: {
              commandExecuted: command,
              initialLogCount: preCommandLogLength,
              newLogCount: allNewLogs.length,
            },
          })
        );
      }

      // Para comandos del jugador durante la batalla, simplemente ejecutar y esperar
      // La CPU responderá automáticamente a través del stream handler
      if (command.includes("p1") && !battle.teamPreviewPhase) {
        console.log("🎯 Comando del jugador detectado, CPU responderá automáticamente");

        // Esperar tiempo adicional para que la CPU responda automáticamente
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Obtener todos los logs después del comando del jugador
        const allNewLogs = battle.logs.slice(preCommandLogLength);
        console.log(`Logs después del comando del jugador: ${allNewLogs.length}`, allNewLogs);

        return res.json(
          formatResponse(true, "Comando ejecutado con respuesta automática de CPU", {
            battleId,
            logs: allNewLogs,
            state: battle.state,
            turnCount: battle.turnCount,
            teamPreviewPhase: battle.teamPreviewPhase,
            debug: {
              commandExecuted: command,
              initialLogCount: preCommandLogLength,
              newLogCount: allNewLogs.length,
              automatic: true,
            },
          })
        );
      }

      // Si es comando de CPU o no necesita respuesta de IA, responder normalmente
      if (newLogs.length === 0) {
        battle.logs.push("Comando ejecutado, esperando más acciones.");
        newLogs.push("Comando ejecutado, esperando más acciones.");
      }

      // Respuesta normal
      res.json(
        formatResponse(true, "Comando ejecutado", {
          battleId,
          logs: newLogs,
          state: battle.state,
          turnCount: battle.turnCount,
          teamPreviewPhase: battle.teamPreviewPhase,
          debug: {
            commandExecuted: command,
            initialLogCount: preCommandLogLength,
            newLogCount: newLogs.length,
          },
        })
      );
    } catch (error) {
      console.error("Error al ejecutar comando:", error);
      res.status(500).json(
        formatResponse(false, "Error al ejecutar comando: " + error.message, {
          debug: { command, error: error.toString() },
        })
      );
    }
  } catch (error) {
    console.error("Error general en /command:", error);
    res.status(500).json(formatResponse(false, "Error al enviar comando: " + error.message));
  }
});

/**
 * @route GET /battle/status/:battleId
 * @desc Obtener el estado actual de la batalla
 */
router.get("/status/:battleId", verifyToken, async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return res.status(404).json(formatResponse(false, "Batalla no encontrada"));
    }

    res.json(
      formatResponse(true, "Estado de batalla recuperado", {
        battleId,
        logs: battle.logs,
        state: battle.state,
        turnCount: battle.turnCount,
        teamPreviewPhase: battle.teamPreviewPhase,
        pendingCommands: battle.pendingCommands || [],
        difficulty: battle.difficulty,
      })
    );
  } catch (error) {
    console.error("Error al obtener estado de batalla:", error);
    res.status(500).json(formatResponse(false, "Error al obtener estado de batalla: " + error.message));
  }
});

/**
 * @route POST /battle/end/:battleId
 * @desc Finalizar una batalla
 */
router.post("/end/:battleId", verifyToken, async (req, res) => {
  try {
    const { battleId } = req.params;

    if (activeBattles.has(battleId)) {
      const battle = activeBattles.get(battleId);

      // Si hay un stream activo, intentamos cerrarlo limpiamente
      if (battle.stream) {
        try {
          battle.stream.end();
        } catch (e) {
          console.error("Error al cerrar el stream:", e);
        }
      }

      activeBattles.delete(battleId);
      res.json(formatResponse(true, "Batalla finalizada correctamente"));
    } else {
      res.status(404).json(formatResponse(false, "Batalla no encontrada"));
    }
  } catch (error) {
    console.error("Error al finalizar batalla:", error);
    res.status(500).json(formatResponse(false, "Error al finalizar batalla: " + error.message));
  }
});

/**
 * @route GET /battle/formats
 * @desc Listar formatos disponibles
 */
router.get("/formats", async (req, res) => {
  try {
    res.json(
      formatResponse(true, "Formatos disponibles", {
        formats: ["gen9ou", "gen8ou", "gen7ou", "gen9randombattle"],
      })
    );
  } catch (error) {
    console.error("Error al obtener formatos:", error);
    res.status(500).json(formatResponse(false, errorMessages.SERVER_ERROR));
  }
});

module.exports = router;
