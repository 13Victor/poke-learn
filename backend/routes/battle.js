const express = require("express");
const { BattleStream, Teams } = require("pokemon-showdown");
const { RandomPlayerAI } = require("pokemon-showdown/dist/sim/tools/random-player-ai");
const router = express.Router();

// Almacenar batallas activas
const activeBattles = new Map();

// Endpoint para iniciar una nueva batalla
router.post("/start", (req, res) => {
  try {
    const { format = "gen7randombattle" } = req.body;

    // Crear un ID único para la batalla
    const battleId = Date.now().toString();

    //processLogs  Generar equipos aleatorios
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

    // Capturar la salida del stream
    (async () => {
      for await (const chunk of battleStream) {
        console.log("Mensaje del simulador:", chunk);
        battle.logs.push(chunk);

        // Si la batalla ha terminado, actualizamos el estado
        if (chunk.includes("|win|") || chunk.includes("|tie|")) {
          battle.state = "completed";
        }
      }
    })();

    // Inicializar la batalla
    battleStream.write(`>start {"formatid":"${battle.format}"}`);
    battleStream.write(`>player p1 {"name":"Jugador","team":${JSON.stringify(battle.playerTeam)}}`);
    battleStream.write(`>player p2 {"name":"CPU","team":${JSON.stringify(battle.aiTeam)}}`);

    // Esperamos un momento para que se procesen los mensajes iniciales
    await new Promise((resolve) => setTimeout(resolve, 500));

    res.json({
      success: true,
      battleId,
      logs: battle.logs,
      state: battle.state,
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
    const { command } = req.body;

    const battle = activeBattles.get(battleId);

    if (!battle || !battle.stream) {
      return res.status(404).json({ success: false, error: "Batalla no encontrada" });
    }

    if (battle.state !== "active") {
      return res.status(400).json({ success: false, error: "La batalla no está activa" });
    }

    // Guardar los logs actuales para encontrar los nuevos después
    const currentLogLength = battle.logs.length;

    // Enviar el comando del jugador
    battle.stream.write(command);

    // Esperar a que el comando se procese
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Determinar si el CPU necesita tomar una decisión
    // En una batalla real, habría que analizar los logs para saber si se espera respuesta del CPU
    // Por simplicidad, enviamos un comando aleatorio para el CPU después de cada comando del jugador

    // Posibles comandos para el CPU (simplificado)
    const cpuCommands = [">p2 move 1", ">p2 move 2", ">p2 move 3", ">p2 move 4"];
    const randomCommand = cpuCommands[Math.floor(Math.random() * cpuCommands.length)];

    // Enviar el comando del CPU
    battle.stream.write(randomCommand);

    // Esperar a que se procese la respuesta del CPU
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Obtener los nuevos logs
    const newLogs = battle.logs.slice(currentLogLength);

    res.json({
      success: true,
      battleId,
      logs: newLogs,
      state: battle.state,
    });
  } catch (error) {
    console.error("Error al enviar comando:", error);
    res.status(500).json({ success: false, error: "Error al enviar comando" });
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
