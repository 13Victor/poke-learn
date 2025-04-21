const express = require("express");
const { BattleStream, Teams } = require("pokemon-showdown");
const router = express.Router();

// Almacenar batallas activas
const activeBattles = new Map();

// Endpoint para iniciar una nueva batalla
router.post("/start", (req, res) => {
  try {
    const { format = "gen7randombattle" } = req.body;

    // Crear un ID único para la batalla
    const battleId = Date.now().toString();

    // Generar equipos aleatorios
    const playerTeam = Teams.pack(Teams.generate(format));
    const aiTeam = Teams.pack(Teams.generate(format));

    // Configuración de la batalla
    const battleSetup = {
      battleId,
      format,
      playerTeam,
      aiTeam,
      logs: [],
      state: "setup",
      lastInputTurn: 0,
    };

    // Guardar en batallas activas
    activeBattles.set(battleId, battleSetup);

    res.json({
      success: true,
      battleId,
      message: "Batalla creada correctamente",
      format,
    });
  } catch (error) {
    console.error("Error al iniciar batalla:", error);
    res.status(500).json({ success: false, error: "Error al iniciar batalla" });
  }
});

// Endpoint para iniciar la batalla y recibir el estado inicial
router.post("/initialize/:battleId", async (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return res.status(404).json({ success: false, error: "Batalla no encontrada" });
    }

    // Crear stream de batalla
    const battleStream = new BattleStream();

    // Guardar referencia al stream de batalla
    battle.stream = battleStream;
    battle.state = "active";
    battle.logs = [];
    battle.turnCount = 0;
    battle.pendingCommands = [];

    // Manejar la salida del stream
    const streamHandler = async () => {
      for await (const chunk of battleStream) {
        console.log("Mensaje del simulador:", chunk);
        battle.logs.push(chunk);

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
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res.json({
      success: true,
      battleId,
      logs: battle.logs,
      state: battle.state,
      turnCount: battle.turnCount,
    });
  } catch (error) {
    console.error("Error al inicializar batalla:", error);
    res.status(500).json({ success: false, error: "Error al inicializar batalla" });
  }
});

// Endpoint para enviar un comando a la batalla
router.post("/command/:battleId", async (req, res) => {
  try {
    const { battleId } = req.params;
    let { command } = req.body;

    console.log(`Recibiendo comando para batalla ${battleId}:`, command);

    const battle = activeBattles.get(battleId);

    if (!battle || !battle.stream) {
      return res.status(404).json({ success: false, error: "Batalla no encontrada" });
    }

    if (battle.state !== "active") {
      return res.status(400).json({ success: false, error: "La batalla no está activa" });
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
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Obtener los nuevos logs después del comando
      const newLogs = battle.logs.slice(preCommandLogLength);
      console.log(`Se generaron ${newLogs.length} nuevos logs después del comando:`, newLogs);

      // Si no hay nuevos logs pero el comando debería generar acción, intentamos con comando de CPU también
      if (newLogs.length === 0 && (command.includes("move") || command.includes("switch"))) {
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

          return res.json({
            success: true,
            battleId,
            logs: allNewLogs,
            state: battle.state,
            turnCount: battle.turnCount,
            debug: {
              commandsExecuted: battle.pendingCommands,
              initialLogCount: preCommandLogLength,
              newLogCount: allNewLogs.length,
            },
          });
        }
      }

      // Si aún no tenemos logs, agregamos un mensaje informativo
      if (newLogs.length === 0) {
        battle.logs.push("Comando ejecutado, pero no generó respuesta del simulador.");
        newLogs.push("Comando ejecutado, pero no generó respuesta del simulador.");
      }

      // Respuesta normal
      res.json({
        success: true,
        battleId,
        logs: newLogs,
        state: battle.state,
        turnCount: battle.turnCount,
        debug: {
          commandExecuted: command,
          initialLogCount: preCommandLogLength,
          newLogCount: newLogs.length,
        },
      });
    } catch (error) {
      console.error("Error al ejecutar comando:", error);
      res.status(500).json({
        success: false,
        error: "Error al ejecutar comando: " + error.message,
        debug: { command, error: error.toString() },
      });
    }
  } catch (error) {
    console.error("Error general en /command:", error);
    res.status(500).json({ success: false, error: "Error al enviar comando: " + error.message });
  }
});

// Endpoint para obtener el estado actual de la batalla
router.get("/status/:battleId", (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = activeBattles.get(battleId);

    if (!battle) {
      return res.status(404).json({ success: false, error: "Batalla no encontrada" });
    }

    res.json({
      success: true,
      battleId,
      logs: battle.logs,
      state: battle.state,
      turnCount: battle.turnCount,
      pendingCommands: battle.pendingCommands || [],
    });
  } catch (error) {
    console.error("Error al obtener estado de batalla:", error);
    res.status(500).json({ success: false, error: "Error al obtener estado de batalla" });
  }
});

// Endpoint para finalizar una batalla
router.post("/end/:battleId", (req, res) => {
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
      res.json({ success: true, message: "Batalla finalizada correctamente" });
    } else {
      res.status(404).json({ success: false, error: "Batalla no encontrada" });
    }
  } catch (error) {
    console.error("Error al finalizar batalla:", error);
    res.status(500).json({ success: false, error: "Error al finalizar batalla" });
  }
});

// Endpoint para listar formatos disponibles
router.get("/formats", (req, res) => {
  res.json({
    formats: ["gen7randombattle", "gen8randombattle", "gen9randombattle"],
  });
});

module.exports = router;
