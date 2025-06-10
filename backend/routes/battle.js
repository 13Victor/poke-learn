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
function getAIMove(battle, availableMoves = [], cpuRequestData = null) {
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
      // For hard mode, select most effective move against opponent
      console.log(`🔥 Modo difícil: analizando efectividad de movimientos...`);
      const hardMove = getMostEffectiveMove(battle, enabledMoves, enabledSlots, cpuRequestData);
      console.log(`🤖 ============= FIN SELECCIÓN MODO DIFÍCIL =============`);
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
 * Helper function to select the most effective move for hard difficulty
 */
function getMostEffectiveMove(battle, enabledMoves, enabledSlots, cpuRequestData) {
  console.log(`🔥 ============= ANÁLISIS DE EFECTIVIDAD DE MOVIMIENTOS - MODO DIFÍCIL =============`);

  try {
    const data = require("../data/dataLoader");
    const moves = data.moves.Moves;
    const typeChart = getTypeChart();

    // Get opponent's active Pokemon
    const playerSide = parseLatestRequestData(battle.logs, "p1");
    if (!playerSide?.side?.pokemon) {
      console.log("⚠️ No se pueden obtener datos del oponente, usando movimiento más potente");
      return getMostPowerfulMove(enabledMoves, enabledSlots);
    }

    const playerActivePokemon = playerSide.side.pokemon.find((p) => p.active);
    if (!playerActivePokemon) {
      console.log("⚠️ No se puede identificar Pokémon activo del oponente, usando movimiento más potente");
      return getMostPowerfulMove(enabledMoves, enabledSlots);
    }

    const opponentPokemonName = playerActivePokemon.details.split(",")[0].trim();
    const opponentTypes = getPokemonTypes(opponentPokemonName);

    if (!opponentTypes) {
      console.log("⚠️ No se pudieron obtener tipos del oponente, usando movimiento más potente");
      return getMostPowerfulMove(enabledMoves, enabledSlots);
    }

    console.log(`🎯 Oponente: ${opponentPokemonName} [${opponentTypes.join(", ")}]`);

    let bestMoveSlot = enabledSlots[0];
    let bestEffectiveness = -1;
    let bestMoveName = "Unknown";

    // NUEVO: Filter out 0 BP moves in hard mode
    const filteredMoves = [];
    const filteredSlots = [];

    enabledMoves.forEach((moveData, index) => {
      const moveName = moveData.move;
      const slot = enabledSlots[index];

      // Find move data by name
      let basePower = 0;
      for (const id in moves) {
        if (moves[id].name === moveName) {
          basePower = moves[id].basePower || 0;
          break;
        }
      }

      // In hard mode, filter out 0 BP (status) moves
      if (battle.difficulty === "hard" && basePower === 0) {
        console.log(`❌ MODO DIFÍCIL: Bloqueando movimiento de estado ${moveName} (0 BP)`);
        return; // Skip this move
      }

      filteredMoves.push(moveData);
      filteredSlots.push(slot);
    });

    // If all moves were filtered out (all status moves), use original moves as fallback
    const movesToAnalyze = filteredMoves.length > 0 ? filteredMoves : enabledMoves;
    const slotsToAnalyze = filteredSlots.length > 0 ? filteredSlots : enabledSlots;

    if (filteredMoves.length === 0 && battle.difficulty === "hard") {
      console.log("⚠️ MODO DIFÍCIL: Todos los movimientos son de estado, usando como último recurso");
    }

    movesToAnalyze.forEach((moveData, index) => {
      const moveName = moveData.move;
      const slot = slotsToAnalyze[index];

      // Find move data by name
      let moveType = null;
      let basePower = 0;

      for (const id in moves) {
        if (moves[id].name === moveName) {
          moveType = moves[id].type?.toLowerCase();
          basePower = moves[id].basePower || 0;
          break;
        }
      }

      if (!moveType) {
        console.log(`⚠️ No se pudo obtener tipo para ${moveName}, asumiendo Normal`);
        moveType = "normal";
      }

      console.log(`🔍 Movimiento: ${moveName} (slot ${slot}) - Tipo: ${moveType}, Poder: ${basePower}`);

      // Calculate type effectiveness
      let effectiveness = 1;
      for (const opponentType of opponentTypes) {
        const typeEffectiveness = typeChart[moveType]?.[opponentType] || 1;
        effectiveness *= typeEffectiveness;
        console.log(`  ${moveType} -> ${opponentType}: ${typeEffectiveness}x`);
      }

      console.log(`  Efectividad total de ${moveName}: ${effectiveness}x`);

      // Calculate total score (effectiveness * base power)
      // For status moves (basePower 0), use effectiveness alone but with lower priority
      const score = basePower > 0 ? effectiveness * basePower : effectiveness * 10;

      console.log(`  Puntuación total de ${moveName}: ${score} (efectividad: ${effectiveness}x, poder: ${basePower})`);

      if (score > bestEffectiveness) {
        bestEffectiveness = score;
        bestMoveSlot = slot;
        bestMoveName = moveName;
      }
    });

    // Log final decision
    const finalEffectiveness =
      bestEffectiveness /
      (movesToAnalyze.find((m) => m.move === bestMoveName)
        ? moves[Object.keys(moves).find((id) => moves[id].name === bestMoveName)]?.basePower || 10
        : 10);

    console.log(`🎯 Mejor movimiento seleccionado: ${bestMoveName} (slot ${bestMoveSlot})`);
    console.log(`   Efectividad: ${finalEffectiveness}x, Puntuación total: ${bestEffectiveness}`);

    if (finalEffectiveness >= 2.0) {
      console.log(`💥 ¡SÚPER EFECTIVO! CPU usando ${bestMoveName}`);
    } else if (finalEffectiveness <= 0.5) {
      console.log(`😤 Poco efectivo, pero es la mejor opción disponible: ${bestMoveName}`);
    } else {
      console.log(`⚖️ Efectividad neutra: ${bestMoveName}`);
    }

    return bestMoveSlot;
  } catch (error) {
    console.error("❌ Error analizando efectividad de movimientos:", error);
    console.log("🔄 Fallback: usando movimiento más potente");
    return getMostPowerfulMove(enabledMoves, enabledSlots);
  }
}

/**
 * Helper function to check if CPU has any super effective moves against opponent
 */
function hasEffectiveMoves(battle, cpuRequestData) {
  console.log(`🔍 ============= VERIFICANDO MOVIMIENTOS EFECTIVOS =============`);

  try {
    const data = require("../data/dataLoader");
    const moves = data.moves.Moves;
    const typeChart = getTypeChart();

    // Get opponent's active Pokemon
    const playerSide = parseLatestRequestData(battle.logs, "p1");
    if (!playerSide?.side?.pokemon) {
      console.log("⚠️ No se pueden obtener datos del oponente");
      return false;
    }

    const playerActivePokemon = playerSide.side.pokemon.find((p) => p.active);
    if (!playerActivePokemon) {
      console.log("⚠️ No se puede identificar Pokémon activo del oponente");
      return false;
    }

    const opponentPokemonName = playerActivePokemon.details.split(",")[0].trim();
    const opponentTypes = getPokemonTypes(opponentPokemonName);

    if (!opponentTypes) {
      console.log("⚠️ No se pudieron obtener tipos del oponente");
      return false;
    }

    const availableMoves = cpuRequestData.active?.[0]?.moves || [];
    const enabledMoves = availableMoves.filter((move) => !move.disabled);

    console.log(`🎯 Verificando efectividad contra: ${opponentPokemonName} [${opponentTypes.join(", ")}]`);
    console.log(`⚔️ Movimientos habilitados: ${enabledMoves.length}`);

    for (const moveData of enabledMoves) {
      const moveName = moveData.move;

      // Find move type and base power
      let moveType = null;
      let basePower = 0;
      for (const id in moves) {
        if (moves[id].name === moveName) {
          moveType = moves[id].type?.toLowerCase();
          basePower = moves[id].basePower || 0;
          break;
        }
      }

      if (!moveType) continue;

      // NUEVO: In hard mode, ignore 0 BP moves for effectiveness check
      if (battle.difficulty === "hard" && basePower === 0) {
        console.log(`🔍 ${moveName} (${moveType}) - IGNORADO en modo difícil (0 BP)`);
        continue;
      }

      // Calculate effectiveness
      let effectiveness = 1;
      for (const opponentType of opponentTypes) {
        const typeEffectiveness = typeChart[moveType]?.[opponentType] || 1;
        effectiveness *= typeEffectiveness;
      }

      console.log(`🔍 ${moveName} (${moveType}, ${basePower} BP) vs [${opponentTypes.join(", ")}]: ${effectiveness}x`);

      // If we have a super effective move, return true
      if (effectiveness >= 2.0) {
        console.log(`💥 ¡MOVIMIENTO SÚPER EFECTIVO ENCONTRADO: ${moveName}!`);
        return true;
      }
    }

    console.log(`⚠️ No hay movimientos súper efectivos disponibles`);
    return false;
  } catch (error) {
    console.error("❌ Error verificando movimientos efectivos:", error);
    return false;
  }
}

/**
 * Helper function to check if AI should switch based on type effectiveness (Hard mode)
 * ACTUALIZADO: Now runs every turn in hard mode and considers 0 BP move filtering
 */
async function shouldAISwitchPokemon(battle, cpuRequestData) {
  console.log(`🔥 ============= ANÁLISIS ESTRATÉGICO CADA TURNO - MODO DIFÍCIL =============`);

  if (battle.difficulty !== "hard") {
    console.log("⚠️ No es modo difícil, no analizando cambio estratégico");
    return null;
  }

  try {
    // Get opponent's active Pokemon first
    const playerSide = parseLatestRequestData(battle.logs, "p1");
    if (!playerSide?.side?.pokemon) {
      console.log("⚠️ No se pueden obtener datos del oponente");
      return null;
    }

    const playerActivePokemon = playerSide.side.pokemon.find((p) => p.active);
    if (!playerActivePokemon) {
      console.log("⚠️ No se puede identificar Pokémon activo del oponente");
      return null;
    }

    const opponentPokemonName = playerActivePokemon.details.split(",")[0].trim();
    const opponentTypes = getPokemonTypes(opponentPokemonName);

    if (!opponentTypes) {
      console.log("⚠️ No se pudieron obtener tipos del oponente");
      return null;
    }

    console.log(
      `🎯 TURNO ${battle.turnCount || 0}: Analizando contra oponente: ${opponentPokemonName} [${opponentTypes.join(
        ", "
      )}]`
    );

    // STEP 1: Check if current Pokemon has super effective NON-STATUS moves
    console.log(`🎯 PASO 1: ¿Tiene movimientos súper efectivos NO de estado el Pokémon actual?`);
    const hasEffectiveMovesResult = hasEffectiveMoves(battle, cpuRequestData);

    if (hasEffectiveMovesResult) {
      console.log(`✅ El Pokémon actual TIENE movimientos súper efectivos no de estado. ¡ATACAR!`);
      console.log(`🔥 ============= DECISIÓN: MANTENER Y ATACAR =============`);
      return null; // Don't switch, use effective move
    }

    console.log(`❌ El Pokémon actual NO tiene movimientos súper efectivos disponibles`);

    // STEP 2: ALWAYS look for a better Pokemon (this runs EVERY TURN in hard mode)
    console.log(`🎯 PASO 2: Buscando un Pokémon mejor para cambiar (ANÁLISIS CADA TURNO)...`);

    const cpuSidePokemon = cpuRequestData.side?.pokemon || [];
    const availableForSwitch = cpuSidePokemon.filter((p) => !p.active && !p.condition.includes("fnt"));

    console.log(`🔄 Pokémon disponibles para cambio: ${availableForSwitch.length}`);

    if (availableForSwitch.length === 0) {
      console.log("❌ No hay Pokémon disponibles para cambiar");
      console.log(`🔥 ============= DECISIÓN: MANTENER Y USAR MEJOR MOVIMIENTO =============`);
      return null;
    }

    // Check each available Pokemon to see if it has effective moves or better matchup
    const data = require("../data/dataLoader");
    const moves = data.moves.Moves;
    const typeChart = getTypeChart();

    let bestSwitchOption = null;
    let bestScore = -1;

    for (let i = 0; i < availableForSwitch.length; i++) {
      const pokemon = availableForSwitch[i];
      const pokemonName = pokemon.details.split(",")[0].trim();
      const pokemonTypes = getPokemonTypes(pokemonName);

      if (!pokemonTypes) continue;

      console.log(`🔍 Analizando: ${pokemonName} [${pokemonTypes.join(", ")}]`);

      // Check if this Pokemon would have effective NON-STATUS moves
      const pokemonMoves = pokemon.moves || [];
      let hasEffectiveMove = false;
      let maxEffectiveness = 0;
      let bestMoveEffectiveness = 0;

      console.log(`  📋 Movimientos de ${pokemonName}: [${pokemonMoves.join(", ")}]`);

      for (const moveName of pokemonMoves) {
        // Find move type and power
        let moveType = null;
        let basePower = 0;

        // Search for move by name (normalize both move name and search term)
        const normalizedMoveName = moveName.toLowerCase().replace(/[\s'-]/g, "");

        for (const id in moves) {
          const normalizedDataMoveName = moves[id].name.toLowerCase().replace(/[\s'-]/g, "");
          if (normalizedDataMoveName === normalizedMoveName) {
            moveType = moves[id].type?.toLowerCase();
            basePower = moves[id].basePower || 0;
            break;
          }
        }

        if (!moveType) {
          console.log(`  ⚠️ No se encontró tipo para movimiento: ${moveName}`);
          continue;
        }

        // NUEVO: In hard mode, ignore status moves (0 BP) for switching analysis
        if (basePower === 0) {
          console.log(`  ❌ Ignorando movimiento de estado: ${moveName} (0 BP)`);
          continue;
        }

        // Calculate effectiveness against each opponent type
        let effectiveness = 1;
        for (const opponentType of opponentTypes) {
          const typeEffectiveness = typeChart[moveType]?.[opponentType] || 1;
          effectiveness *= typeEffectiveness;
        }

        console.log(
          `  📋 ${moveName} (${moveType}, ${basePower} BP): ${effectiveness}x efectividad contra [${opponentTypes.join(
            ", "
          )}]`
        );

        if (effectiveness >= 2.0) {
          hasEffectiveMove = true;
          console.log(`    💥 ¡SÚPER EFECTIVO!`);
        }

        // Consider both effectiveness and base power for overall offensive potential
        const moveScore = effectiveness * basePower;
        bestMoveEffectiveness = Math.max(bestMoveEffectiveness, moveScore);
        maxEffectiveness = Math.max(maxEffectiveness, effectiveness);
      }

      console.log(`  🎯 ${pokemonName} - Máxima efectividad encontrada: ${maxEffectiveness}x`);

      // Calculate defensive advantage (how well this Pokemon resists opponent's attacks)
      let defensiveScore = 1;
      for (const opponentType of opponentTypes) {
        let typeResistance = 1;
        for (const pokemonType of pokemonTypes) {
          const resistance = typeChart[opponentType]?.[pokemonType] || 1;
          typeResistance *= resistance;
        }
        defensiveScore = Math.min(defensiveScore, typeResistance); // Take worst case
      }

      // Enhanced scoring system for every-turn analysis
      let totalScore = 0;

      // HIGHEST priority: Pokemon with super effective NON-STATUS moves
      if (hasEffectiveMove) {
        totalScore += 2000; // Even higher bonus for super effective attacking moves
        console.log(`  💥 ¡${pokemonName} TIENE movimientos súper efectivos NO de estado! +2000 puntos`);
      }

      // Add offensive potential (use raw effectiveness score)
      totalScore += maxEffectiveness * 150; // Increased weight for offensive potential

      // Add defensive advantage (resistance gives points, weakness reduces points)
      if (defensiveScore <= 0.5) {
        totalScore += 300; // Higher bonus for resisting opponent's attacks
        console.log(`  🛡️ ${pokemonName} resiste ataques del oponente (${defensiveScore}x) +300 puntos`);
      } else if (defensiveScore >= 2.0) {
        totalScore -= 200; // Higher penalty for being weak to opponent
        console.log(`  💔 ${pokemonName} es débil a ataques del oponente (${defensiveScore}x) -200 puntos`);
      }

      console.log(
        `  🏆 ${pokemonName} - Mejor efectividad: ${maxEffectiveness}x, Defensiva: ${defensiveScore}x, Score total: ${totalScore}`
      );

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestSwitchOption = {
          pokemon,
          slot: cpuSidePokemon.findIndex((p) => p.details === pokemon.details) + 1,
          maxEffectiveness,
          defensiveScore,
          hasEffectiveMove,
          totalScore,
        };
      }
    }

    // STEP 3: Make decision - be more aggressive about switching in hard mode every-turn analysis
    if (bestSwitchOption) {
      const switchName = bestSwitchOption.pokemon.details.split(",")[0].trim();

      // More aggressive switching criteria for hard mode every-turn analysis
      const shouldSwitch =
        bestSwitchOption.hasEffectiveMove || // Has super effective non-status moves
        bestSwitchOption.defensiveScore <= 0.5 || // Good defensive matchup
        (bestSwitchOption.maxEffectiveness >= 1.5 && bestSwitchOption.totalScore >= 300); // Decent advantage

      if (shouldSwitch) {
        console.log(`🎯 ¡CAMBIO ESTRATÉGICO CADA TURNO: ${switchName} (slot ${bestSwitchOption.slot})!`);
        console.log(`   Movimientos súper efectivos no de estado: ${bestSwitchOption.hasEffectiveMove ? "SÍ" : "NO"}`);
        console.log(`   Efectividad máxima: ${bestSwitchOption.maxEffectiveness}x`);
        console.log(`   Resistencia defensiva: ${bestSwitchOption.defensiveScore}x`);
        console.log(`   Puntuación total: ${bestSwitchOption.totalScore}`);
        console.log(`🔥 ============= DECISIÓN: CAMBIAR A ${switchName.toUpperCase()} =============`);
        return bestSwitchOption.slot;
      } else {
        console.log(`❌ Mejor alternativa encontrada pero no es suficientemente superior para cambio`);
        console.log(
          `   ${switchName}: score ${bestSwitchOption.totalScore}, efectividad ${bestSwitchOption.maxEffectiveness}x`
        );
      }
    } else {
      console.log(`❌ No se encontraron alternativas viables para cambio`);
    }

    console.log(`🔥 ============= DECISIÓN: MANTENER Y USAR MEJOR MOVIMIENTO DISPONIBLE =============`);
    return null;
  } catch (error) {
    console.error("❌ Error en análisis estratégico cada turno:", error);
    return null;
  }
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
        // For hard mode, even when forced to switch, try to pick strategically
        if (battle.difficulty === "hard") {
          console.log("🔥 Modo difícil: selección estratégica para cambio forzado");
          const strategicChoice = await shouldAISwitchPokemon(battle, cpuRequestData);

          if (strategicChoice) {
            cpuCommand = `>p2 switch ${strategicChoice}`;
            const strategicPokemon = availablePokemon[strategicChoice - 1];
            console.log(
              `🎯 CPU cambio estratégico forzado a slot ${strategicChoice}: ${strategicPokemon.details.split(",")[0]}`
            );
          } else {
            // Random selection as fallback
            const randomIndex = Math.floor(Math.random() * viablePokemon.length);
            const selectedPokemon = viablePokemon[randomIndex];
            const originalIndex =
              availablePokemon.findIndex((pokemon) => pokemon.details === selectedPokemon.details) + 1;
            cpuCommand = `>p2 switch ${originalIndex}`;
            console.log(
              `🎲 CPU cambio aleatorio (estrategia falló) a slot ${originalIndex}: ${
                selectedPokemon.details.split(",")[0]
              }`
            );
          }
        } else {
          // Random selection for easy/medium modes
          const randomIndex = Math.floor(Math.random() * viablePokemon.length);
          const selectedPokemon = viablePokemon[randomIndex];
          const originalIndex =
            availablePokemon.findIndex((pokemon) => pokemon.details === selectedPokemon.details) + 1;
          cpuCommand = `>p2 switch ${originalIndex}`;
          console.log(`🎲 CPU cambiando a slot ${originalIndex}: ${selectedPokemon.details.split(",")[0]}`);
        }
      } else {
        console.log("❌ No hay Pokémon viables para cambiar, usando slot 2 por defecto");
        cpuCommand = ">p2 switch 2";
      }
    }
    // Verificar si la CPU puede atacar
    else if (cpuRequestData.active && cpuRequestData.active[0] && cpuRequestData.active[0].moves) {
      console.log("⚔️ CPU puede atacar - analizando estrategia...");

      // For hard mode, ALWAYS check if strategic switching is needed (every turn)
      if (battle.difficulty === "hard") {
        console.log("🔥 Modo difícil detectado - aplicando estrategia CADA TURNO...");
        const strategicSwitchSlot = await shouldAISwitchPokemon(battle, cpuRequestData);

        if (strategicSwitchSlot) {
          cpuCommand = `>p2 switch ${strategicSwitchSlot}`;
          console.log(`🎯 CPU realizando cambio estratégico CADA TURNO a slot ${strategicSwitchSlot}`);
        }
      }

      // If no strategic switch was needed, proceed with move selection
      if (!cpuCommand) {
        const allMoves = cpuRequestData.active[0].moves;
        const enabledMoves = allMoves.filter((move) => !move.disabled);

        if (enabledMoves.length > 0) {
          const moveSlot = getAIMove(battle, allMoves, cpuRequestData);
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

/**
 * Helper function to get type chart data
 */
function getTypeChart() {
  try {
    // Load the type chart from the JSON file
    const typeChart = require("../data/types.json");
    console.log("🔍 Type chart cargado exitosamente");
    return typeChart;
  } catch (error) {
    console.error("❌ Error loading type chart:", error);
    // Return a basic type chart as fallback
    return {
      normal: { rock: 0.5, ghost: 0, steel: 0.5 },
      fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
      water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
      electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
      grass: {
        fire: 0.5,
        water: 2,
        electric: 1,
        grass: 0.5,
        poison: 0.5,
        ground: 2,
        flying: 0.5,
        bug: 0.5,
        rock: 2,
        dragon: 0.5,
        steel: 0.5,
      },
      ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
      fighting: {
        normal: 2,
        ice: 2,
        poison: 0.5,
        flying: 0.5,
        psychic: 0.5,
        bug: 0.5,
        rock: 2,
        ghost: 0,
        dark: 2,
        steel: 2,
        fairy: 0.5,
      },
      poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
      ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
      flying: { electric: 0.5, grass: 2, ice: 1, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
      psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
      bug: {
        fire: 0.5,
        grass: 2,
        fighting: 0.5,
        poison: 0.5,
        flying: 0.5,
        psychic: 2,
        ghost: 0.5,
        dark: 2,
        steel: 0.5,
        fairy: 0.5,
      },
      rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
      ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
      dragon: { dragon: 2, steel: 0.5, fairy: 0 },
      dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
      steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
      fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
    };
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

module.exports = router;
