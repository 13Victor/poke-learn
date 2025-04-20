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

    // Mantener un registro de si encontramos requests para p1 y p2
    let p1RequestFound = false;
    let p2RequestFound = false;

    // Recorrer cada log recibido
    for (const log of logs) {
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
      if (log.includes("|win|") || log.includes("|tie|")) {
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

      // Enviar el comando al servidor
      const response = await API.post(`/battle/command/${battleId}`, { command });
      console.log("Respuesta completa:", response);

      // Añadir los nuevos logs a los existentes
      if (response.data.logs && response.data.logs.length > 0) {
        // Guardar la longitud actual para mostrar solo los nuevos
        const currentLength = battleLogs.length;

        // Agregar los nuevos logs
        setBattleLogs((prevLogs) => [...prevLogs, ...response.data.logs]);
        console.log(`Añadidos ${response.data.logs.length} nuevos logs`);

        // Procesar los nuevos logs
        processLogs(response.data.logs);
      } else {
        console.warn("No se recibieron nuevos logs del servidor");

        // Si necesitamos enviar automáticamente comandos de CPU, lo hacemos aquí
        if (command.startsWith(">p1") && !playerForceSwitch && !cpuForceSwitch) {
          // El comando fue del jugador, intentar enviar un comando automático de CPU
          const cpuCommand = ">p2 move 1";
          console.log("Intentando enviar comando automático de CPU:", cpuCommand);

          // Añadir mensaje informativo al log
          setBattleLogs((prevLogs) => [
            ...prevLogs,
            `Comando enviado: ${command} (procesando...)`,
            `Enviando respuesta automática: ${cpuCommand}`,
          ]);

          // Reintentar enviando ambos comandos juntos
          try {
            const combinedResponse = await API.post(`/battle/command/${battleId}`, {
              command: `${command}\n${cpuCommand}`,
            });

            if (combinedResponse.data.logs && combinedResponse.data.logs.length > 0) {
              setBattleLogs((prevLogs) => [...prevLogs, ...combinedResponse.data.logs]);
              processLogs(combinedResponse.data.logs);
            } else {
              // Si sigue sin funcionar, mostrar mensaje de error
              setBattleLogs((prevLogs) => [
                ...prevLogs,
                "No se pudieron procesar los comandos. Intenta con otro comando.",
              ]);
            }
          } catch (err) {
            console.error("Error al enviar comandos combinados:", err);
            setBattleLogs((prevLogs) => [...prevLogs, `Error: ${err.message}`]);
          }
        } else {
          // Informar al usuario que el comando se envió pero no generó respuesta
          setBattleLogs((prevLogs) => [...prevLogs, `Comando enviado: ${command} (Sin respuesta del servidor)`]);
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
