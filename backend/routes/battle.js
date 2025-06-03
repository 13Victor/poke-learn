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
    const { format = "gen9ou", playerTeam = null, rivalTeamExport = null, useCustomTeams = false } = req.body;

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
    };

    activeBattles.set(battleId, battleSetup);

    res.json(
      formatResponse(true, "Batalla creada correctamente", {
        battleId,
        format,
        useCustomTeams,
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
    await battleStream.write(`>player p1 {"name":"Jugador","team":${JSON.stringify(battle.playerTeam)}}`);
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log("Configurando jugador 2...");
    await battleStream.write(`>player p2 {"name":"CPU","team":${JSON.stringify(battle.aiTeam)}}`);

    // Esperamos más tiempo para que se procesen los mensajes iniciales
    await new Promise((resolve) => setTimeout(resolve, 1500));

    res.json(
      formatResponse(true, "Batalla inicializada correctamente", {
        battleId,
        logs: battle.logs,
        state: battle.state,
        turnCount: battle.turnCount,
        teamPreviewPhase: battle.teamPreviewPhase,
      })
    );
  } catch (error) {
    console.error("Error al inicializar batalla:", error);
    res.status(500).json(formatResponse(false, "Error al inicializar batalla: " + error.message));
  }
});

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
        console.log("🎯 Team preview command from player, sending CPU team command");

        // Automatically send CPU team command
        const cpuTeamCommand = ">p2 team 123456";
        battle.pendingCommands.push(cpuTeamCommand);

        await battle.stream.write(cpuTeamCommand);
        await new Promise((resolve) => setTimeout(resolve, 1000));

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
              commandsExecuted: [command, cpuTeamCommand],
              initialLogCount: preCommandLogLength,
              newLogCount: allNewLogs.length,
            },
          })
        );
      }

      // Si no hay nuevos logs pero el comando debería generar acción, intentamos con comando de CPU también
      if (
        newLogs.length === 0 &&
        (command.includes("move") || command.includes("switch")) &&
        !battle.teamPreviewPhase
      ) {
        console.log("No se detectaron logs, probando con comando de CPU adicional...");

        // Determinar si es comando del jugador
        const isP1Command = command.includes("p1");

        if (isP1Command) {
          // Crear un comando automático para la CPU
          const cpuCommand = ">p2 move 1";
          console.log("Enviando comando de CPU:", cpuCommand);

          // Almacenar este comando también
          battle.pendingCommands.push(cpuCommand);

          // Ejecutar comando de la CPU
          await battle.stream.write(cpuCommand);

          // Esperar que se procese
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Obtener todos los logs nuevos después de ambos comandos
          const allNewLogs = battle.logs.slice(preCommandLogLength);
          console.log(`Logs después de comandos del jugador y CPU: ${allNewLogs.length}`, allNewLogs);

          // Si aún no hay logs, agregamos un mensaje informativo
          if (allNewLogs.length === 0) {
            battle.logs.push("Comando ejecutado, pero no generó respuesta del simulador.");
            allNewLogs.push("Comando ejecutado, pero no generó respuesta del simulador.");
          }

          return res.json(
            formatResponse(true, "Comando ejecutado", {
              battleId,
              logs: allNewLogs,
              state: battle.state,
              turnCount: battle.turnCount,
              teamPreviewPhase: battle.teamPreviewPhase,
              debug: {
                commandsExecuted: battle.pendingCommands,
                initialLogCount: preCommandLogLength,
                newLogCount: allNewLogs.length,
              },
            })
          );
        }
      }

      // Si aún no tenemos logs, agregamos un mensaje informativo
      if (newLogs.length === 0) {
        battle.logs.push("Comando ejecutado, pero no generó respuesta del simulador.");
        newLogs.push("Comando ejecutado, pero no generó respuesta del simulador.");
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
