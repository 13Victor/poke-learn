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
 * Helper function to get a random AI move based on difficulty
 */
function getAIMove(battle, availableMoves = []) {
  const difficulty = battle.difficulty || "easy";

  console.log(`🤖 ============= SELECCIÓN DE MOVIMIENTO IA - DIFICULTAD: ${difficulty.toUpperCase()} =============`);
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
      console.log(`🤖 ============= FIN SELECCIÓN MODO FÁCIL =============`);
      return selectedMove;

    case "medium":
      // For medium mode, select move with highest base power
      console.log(`⚡ Modo medio: analizando poder base de movimientos...`);
      const mediumMove = getMostPowerfulMove(enabledMoves, enabledSlots);
      console.log(`🤖 ============= FIN SELECCIÓN MODO MEDIO =============`);
      return mediumMove;

    case "hard":
    default:
      // For hard mode, use advanced strategy but still select most powerful move for attacking
      console.log(`🔥 Modo difícil: usando estrategia avanzada...`);
      const hardMove = getMostPowerfulMove(enabledMoves, enabledSlots);
      console.log(`🤖 ============= FIN SELECCIÓN MODO DIFÍCIL =============`);
      return hardMove;
  }
}

/**
 * Helper function to check if AI should switch based on type effectiveness (Hard mode)
 */
async function shouldAISwitchPokemon(battle, cpuRequestData) {
  console.log(`🔥 ============= ANÁLISIS DE CAMBIO DE POKÉMON - MODO DIFÍCIL =============`);

  if (battle.difficulty !== "hard") {
    console.log("⚠️ No es modo difícil, no analizando cambio estratégico");
    return null;
  }

  try {
    // Get current active pokemon data for both sides
    const cpuPokemon = cpuRequestData.active?.[0];
    const playerSide = parseLatestRequestData(battle.logs, "p1");
    const playerPokemon = playerSide?.active?.[0];

    if (!cpuPokemon || !playerPokemon) {
      console.log("⚠️ No se pueden obtener datos de Pokémon activos");
      return null;
    }

    console.log(`🤖 CPU Pokémon activo: ${cpuPokemon.moves?.[0]?.move || "Unknown"}`);
    console.log(`👤 Player Pokémon activo: ${playerPokemon.moves?.[0]?.move || "Unknown"}`);

    // For now, we'll use a simplified approach - get pokemon data from the details in the side
    const cpuSidePokemon = cpuRequestData.side?.pokemon || [];
    const playerSidePokemon = playerSide?.side?.pokemon || [];

    console.log(`🎯 CPU tiene ${cpuSidePokemon.length} Pokémon en el equipo`);
    console.log(`🎯 Player tiene ${playerSidePokemon.length} Pokémon en el equipo`);

    // Find current active pokemon in the team data
    const currentCpuActive = cpuSidePokemon.find((p) => p.active);
    const currentPlayerActive = playerSidePokemon.find((p) => p.active);

    if (!currentCpuActive || !currentPlayerActive) {
      console.log("⚠️ No se pueden identificar Pokémon activos en los datos del side");
      return null;
    }

    console.log(`🤖 CPU Pokémon activo identificado: ${currentCpuActive.details}`);
    console.log(`👤 Player Pokémon activo identificado: ${currentPlayerActive.details}`);

    // Extract pokemon names and types from details
    const cpuPokemonName = currentCpuActive.details.split(",")[0].trim();
    const playerPokemonName = currentPlayerActive.details.split(",")[0].trim();

    console.log(`🔍 Analizando tipos: CPU=${cpuPokemonName} vs Player=${playerPokemonName}`);

    // Get type data (this would need to be loaded from the data files)
    const typeChart = getTypeChart();
    const cpuTypes = getPokemonTypes(cpuPokemonName);
    const playerTypes = getPokemonTypes(playerPokemonName);

    if (!cpuTypes || !playerTypes) {
      console.log("⚠️ No se pudieron obtener los tipos de los Pokémon");
      return null;
    }

    console.log(`🤖 CPU tipos: [${cpuTypes.join(", ")}]`);
    console.log(`👤 Player tipos: [${playerTypes.join(", ")}]`);

    // Calculate type effectiveness: How effective is CPU against Player
    const cpuEffectivenessAgainstPlayer = calculateTypeEffectiveness(cpuTypes, playerTypes, typeChart);
    console.log(`⚔️ Efectividad de CPU contra Player: ${cpuEffectivenessAgainstPlayer}x`);

    // Calculate type effectiveness: How effective is Player against CPU
    const playerEffectivenessAgainstCpu = calculateTypeEffectiveness(playerTypes, cpuTypes, typeChart);
    console.log(`🛡️ Efectividad de Player contra CPU: ${playerEffectivenessAgainstCpu}x`);

    // If CPU is at a significant disadvantage (taking super effective damage), consider switching
    if (playerEffectivenessAgainstCpu >= 2.0) {
      console.log(
        `🚨 CPU está en DESVENTAJA (recibe ${playerEffectivenessAgainstCpu}x daño)! Buscando mejor opción...`
      );

      // Look for a better pokemon to switch to
      const availableForSwitch = cpuSidePokemon.filter((p) => !p.active && !p.condition.includes("fnt"));
      console.log(`🔄 Pokémon disponibles para cambio: ${availableForSwitch.length}`);

      if (availableForSwitch.length === 0) {
        console.log("❌ No hay Pokémon disponibles para cambiar");
        return null;
      }

      // Find the best counter
      let bestCounter = null;
      let bestEffectiveness = -1;
      let bestSlot = -1;

      availableForSwitch.forEach((pokemon, index) => {
        const pokemonName = pokemon.details.split(",")[0].trim();
        const pokemonTypes = getPokemonTypes(pokemonName);

        if (pokemonTypes) {
          const effectiveness = calculateTypeEffectiveness(pokemonTypes, playerTypes, typeChart);
          const resistance = calculateTypeEffectiveness(playerTypes, pokemonTypes, typeChart);

          console.log(
            `🔍 ${pokemonName} [${pokemonTypes.join(", ")}]: ${effectiveness}x vs Player, recibe ${resistance}x`
          );

          // Prioritize pokemon that resist player's attacks or are super effective
          const score = effectiveness + 1 / Math.max(resistance, 0.5); // Higher score is better

          if (score > bestEffectiveness) {
            bestEffectiveness = score;
            bestCounter = pokemon;
            bestSlot = cpuSidePokemon.findIndex((p) => p.details === pokemon.details) + 1;
          }
        }
      });

      if (bestCounter && bestSlot > 0) {
        const counterName = bestCounter.details.split(",")[0].trim();
        console.log(`🎯 Mejor counter encontrado: ${counterName} (slot ${bestSlot})`);
        console.log(`🔥 ============= CAMBIO ESTRATÉGICO RECOMENDADO =============`);
        return bestSlot;
      }
    } else if (cpuEffectivenessAgainstPlayer < 1.0) {
      console.log(`⚠️ CPU no es muy efectivo (${cpuEffectivenessAgainstPlayer}x), pero no en peligro inmediato`);
    } else {
      console.log(
        `✅ CPU está en buena posición (${cpuEffectivenessAgainstPlayer}x vs ${playerEffectivenessAgainstCpu}x)`
      );
    }

    console.log(`🔥 ============= NO SE REQUIERE CAMBIO =============`);
    return null;
  } catch (error) {
    console.error("❌ Error analizando cambio estratégico:", error);
    return null;
  }
}

/**
 * Helper function to get type chart data
 */
function getTypeChart() {
  try {
    const data = require("../data/dataLoader");
    return data.types || {};
  } catch (error) {
    console.error("Error loading type chart:", error);
    return {};
  }
}

/**
 * Helper function to get pokemon types by name
 */
function getPokemonTypes(pokemonName) {
  try {
    const data = require("../data/dataLoader");
    const pokedex = data.pokedex.Pokedex;

    // Normalize pokemon name
    const normalizedName = pokemonName.toLowerCase().replace(/[\s'-]/g, "");

    // Search for pokemon
    for (const pokemonId in pokedex) {
      const pokemon = pokedex[pokemonId];
      const normalizedPokemonName = pokemon.name.toLowerCase().replace(/[\s'-]/g, "");

      if (normalizedPokemonName === normalizedName) {
        console.log(`🔍 Tipos encontrados para ${pokemonName}: [${pokemon.types.join(", ")}]`);
        return pokemon.types.map((type) => type.toLowerCase());
      }
    }

    console.log(`⚠️ No se encontraron tipos para: ${pokemonName}`);
    return null;
  } catch (error) {
    console.error(`Error getting types for ${pokemonName}:`, error);
    return null;
  }
}

/**
 * Helper function to calculate type effectiveness
 */
function calculateTypeEffectiveness(attackingTypes, defendingTypes, typeChart) {
  console.log(`🧮 Calculando efectividad: [${attackingTypes.join(", ")}] -> [${defendingTypes.join(", ")}]`);

  if (!attackingTypes || !defendingTypes || !typeChart) {
    console.log("⚠️ Datos insuficientes para calcular efectividad");
    return 1;
  }

  let totalEffectiveness = 1;

  // For dual-type pokemon, we need to calculate effectiveness against both types
  for (const attackingType of attackingTypes) {
    let moveEffectiveness = 1;

    for (const defendingType of defendingTypes) {
      const effectiveness = typeChart[attackingType]?.[defendingType] || 1;
      moveEffectiveness *= effectiveness;
      console.log(`  ${attackingType} -> ${defendingType}: ${effectiveness}x`);
    }

    // For multiple attacking types, we typically want the best effectiveness
    totalEffectiveness = Math.max(totalEffectiveness, moveEffectiveness);
    console.log(`  Efectividad de ${attackingType}: ${moveEffectiveness}x`);
  }

  console.log(`🎯 Efectividad total: ${totalEffectiveness}x`);
  return totalEffectiveness;
}

/**
 * NUEVA FUNCIÓN: Manejar automáticamente las acciones de la CPU
 */
async function handleAutomaticCPUAction(battle) {
  if (!battle.stream || battle.state !== "active" || battle.waitingForCPUAction) {
    return; // Evitar múltiples ejecuciones simultáneas
  }

  battle.waitingForCPUAction = true;

  try {
    console.log("🤖 ============= PROCESANDO ACCIÓN AUTOMÁTICA DE CPU =============");

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
      console.log("⚔️ CPU puede atacar - analizando estrategia...");

      // For hard mode, check if strategic switching is needed
      if (battle.difficulty === "hard") {
        console.log("🔥 Modo difícil detectado - verificando si debe cambiar por estrategia...");
        const strategicSwitchSlot = await shouldAISwitchPokemon(battle, cpuRequestData);

        if (strategicSwitchSlot) {
          cpuCommand = `>p2 switch ${strategicSwitchSlot}`;
          console.log(`🎯 CPU realizando cambio estratégico a slot ${strategicSwitchSlot}`);
        }
      }

      // If no strategic switch was needed, proceed with move selection
      if (!cpuCommand) {
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
    console.log("🤖 ============= FIN PROCESAMIENTO ACCIÓN CPU =============");
  }
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
