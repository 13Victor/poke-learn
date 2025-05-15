// src/hooks/useBattle.js
import { useState, useEffect } from "react";
import axios from "axios";

// Configurar axios para que apunte al backend
const API = axios.create({
  baseURL: "http://localhost:5000/",
  headers: {
    "Content-Type": "application/json",
  },
});

export function useBattle() {
  const [battleId, setBattleId] = useState(null);
  const [battleState, setBattleState] = useState("idle");
  const [battleLogs, setBattleLogs] = useState([]);
  const [requestData, setRequestData] = useState(null);
  const [playerForceSwitch, setPlayerForceSwitch] = useState(false);
  const [cpuForceSwitch, setCpuForceSwitch] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState("gen7randombattle");

  // Iniciar una nueva batalla
  const startBattle = async () => {
    try {
      setBattleState("loading");
      setError(null);
      setBattleLogs([]);
      setRequestData(null);
      setPlayerForceSwitch(false);
      setCpuForceSwitch(false);

      // Paso 1: Crear la batalla
      const createResponse = await API.post("/battle/start", { format });
      const { battleId } = createResponse.data;
      setBattleId(battleId);

      // Paso 2: Inicializar la batalla
      const initResponse = await API.post(`/battle/initialize/${battleId}`);

      setBattleLogs(initResponse.data.logs || []);
      setBattleState(initResponse.data.state === "active" ? "active" : "completed");

      // Procesar los logs para encontrar los datos de request
      processLogs(initResponse.data.logs || []);
    } catch (err) {
      console.error("Error al iniciar batalla:", err);
      setError("No se pudo iniciar la batalla. Intenta nuevamente.");
      setBattleState("idle");
    }
  };

  // Procesar logs en busca de datos de request
  const processLogs = (logs) => {
    console.log("Procesando logs:", logs);

    if (!logs || logs.length === 0) {
      console.warn("No hay logs para procesar");
      return;
    }

    // Mantener un registro de si encontramos requests para p1 y p2
    let p1RequestFound = false;
    let p2RequestFound = false;

    // Recorrer cada log recibido
    for (const log of logs) {
      // Si el log es un string vacío o no es un string, lo saltamos
      if (!log || typeof log !== "string") {
        continue;
      }

      // Dividir por líneas para buscar el request en cualquier parte del mensaje
      const lines = log.split("\n");

      // Determinar si es un mensaje para p1 o p2
      const isP1Message = log.includes("sideupdate\np1");
      const isP2Message = log.includes("sideupdate\np2");

      // Buscar la línea que contiene |request|
      for (const line of lines) {
        if (line.includes("|request|")) {
          try {
            // Extraer el JSON que viene después de |request|
            const requestJson = line.substring(line.indexOf("|request|") + "|request|".length);
            console.log("REQUEST JSON encontrado:", requestJson);

            if (!requestJson || requestJson.trim() === "") {
              console.warn("REQUEST JSON vacío");
              continue;
            }

            const request = JSON.parse(requestJson);
            console.log("REQUEST parseado:", request);

            if (isP1Message) {
              p1RequestFound = true;
              setRequestData(request);

              // Comprobar si el jugador está forzado a cambiar de Pokémon
              if (request.forceSwitch && request.forceSwitch[0] === true) {
                setPlayerForceSwitch(true);
                console.log("El jugador debe cambiar de Pokémon");
              } else {
                setPlayerForceSwitch(false);
              }
            } else if (isP2Message) {
              p2RequestFound = true;

              // Comprobar si la CPU está forzada a cambiar de Pokémon
              if (request.forceSwitch && request.forceSwitch[0] === true) {
                setCpuForceSwitch(true);
                console.log("La CPU debe cambiar de Pokémon");
              } else {
                setCpuForceSwitch(false);
              }
            }
          } catch (e) {
            console.error("Error al procesar request:", e, "en línea:", line);
          }
        }
      }
    }

    // Buscar también mensajes de finalización de batalla
    for (const log of logs) {
      if (typeof log === "string" && (log.includes("|win|") || log.includes("|tie|"))) {
        setBattleState("completed");
        break;
      }
    }

    // Si no se encontró ningún request, mantener el estado actual
    if (!p1RequestFound && !p2RequestFound) {
      console.log("No se encontraron nuevos requests en los logs");
    }
  };

  // Enviar un comando a la batalla
  const sendCommand = async (command) => {
    if (battleState !== "active" || !battleId || isProcessingCommand) {
      if (isProcessingCommand) {
        setError("Espera a que se complete el comando anterior");
      } else {
        setError("No hay una batalla activa");
      }
      return;
    }

    try {
      console.log("Enviando comando:", command);
      setError(null);
      setIsProcessingCommand(true);

      // Añadir log de comando enviado para feedback visual inmediato
      setBattleLogs((prevLogs) => [...prevLogs, `Enviando comando: ${command}`]);

      // Enviar el comando al servidor
      const response = await API.post(`/battle/command/${battleId}`, { command });
      console.log("Respuesta del servidor:", response.data);

      // Añadir los nuevos logs a los existentes
      if (response.data.logs && response.data.logs.length > 0) {
        console.log(`Añadiendo ${response.data.logs.length} nuevos logs:`, response.data.logs);

        // Agregar los nuevos logs
        setBattleLogs((prevLogs) => [...prevLogs, ...response.data.logs]);

        // Procesar los nuevos logs
        processLogs(response.data.logs);
      } else {
        console.warn("No se recibieron nuevos logs del servidor");

        // Si no hay logs, mostramos un mensaje informativo
        setBattleLogs((prevLogs) => [
          ...prevLogs,
          "No se recibió respuesta del servidor. La batalla puede estar esperando más acciones.",
        ]);

        // Si el comando era del jugador (p1) y no hay respuesta, probablemente necesitamos un comando de CPU
        if (command.includes("p1") && !playerForceSwitch && !cpuForceSwitch) {
          console.log("Comando del jugador sin respuesta, probando con comando automático de CPU");

          // Esperar un momento para que el frontend se actualice
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Enviar un comando automático para la CPU
          try {
            const cpuCommand = ">p2 move 1";
            setBattleLogs((prevLogs) => [...prevLogs, `Enviando comando automático: ${cpuCommand}`]);

            const cpuResponse = await API.post(`/battle/command/${battleId}`, { command: cpuCommand });

            if (cpuResponse.data.logs && cpuResponse.data.logs.length > 0) {
              setBattleLogs((prevLogs) => [...prevLogs, ...cpuResponse.data.logs]);
              processLogs(cpuResponse.data.logs);
              console.log("Comando automático de CPU exitoso");
            } else {
              setBattleLogs((prevLogs) => [...prevLogs, "No se recibió respuesta al comando automático de CPU."]);
            }
          } catch (cpuErr) {
            console.error("Error al enviar comando automático de CPU:", cpuErr);
            setBattleLogs((prevLogs) => [...prevLogs, `Error al enviar comando automático de CPU: ${cpuErr.message}`]);
          }
        }
      }

      // Verificar si la batalla ha terminado
      if (response.data.state === "completed") {
        setBattleState("completed");
      }

      // Actualizar estado de procesamiento
      setIsProcessingCommand(false);
    } catch (err) {
      console.error("Error al enviar comando:", err);
      setError(`Error al enviar comando: ${err.message}`);
      setIsProcessingCommand(false);

      // Mensaje de error en los logs
      setBattleLogs((prevLogs) => [...prevLogs, `Error al enviar comando: ${command}. ${err.message}`]);
    }
  };

  return {
    battleId,
    battleState,
    battleLogs,
    requestData,
    playerForceSwitch,
    cpuForceSwitch,
    isProcessingCommand,
    error,
    format,
    setFormat,
    startBattle,
    sendCommand,
    setError,
  };
}
