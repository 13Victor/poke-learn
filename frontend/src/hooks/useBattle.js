// src/hooks/useBattle.js
import { useState } from "react";
import apiService from "../services/apiService";

export function useBattle() {
  const [battleId, setBattleId] = useState(null);
  const [battleState, setBattleState] = useState("idle");
  const [battleLogs, setBattleLogs] = useState([]);
  const [requestData, setRequestData] = useState(null);
  const [playerForceSwitch, setPlayerForceSwitch] = useState(false);
  const [cpuForceSwitch, setCpuForceSwitch] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState("gen9ou"); // Changed to gen9ou
  const [isTeamPreview, setIsTeamPreview] = useState(false);
  const [teamPreviewPokemon, setTeamPreviewPokemon] = useState({ p1: [], p2: [] });

  // Iniciar una nueva batalla
  const startBattle = async (battleConfig = null) => {
    try {
      setBattleState("loading");
      setError(null);
      setBattleLogs([]);
      setRequestData(null);
      setPlayerForceSwitch(false);
      setCpuForceSwitch(false);
      setIsTeamPreview(false);
      setTeamPreviewPokemon({ p1: [], p2: [] });

      if (!apiService.isAuthenticated()) {
        throw new Error("No estás autenticado. Por favor, inicia sesión.");
      }

      // Get battle config from localStorage if not provided
      const config = battleConfig || JSON.parse(localStorage.getItem("battleConfig") || "{}");

      // Prepare request body
      const requestBody = { format };

      // Add custom teams if available
      if (config.playerTeamShowdown && config.rivalTeamExport) {
        requestBody.playerTeam = config.playerTeamShowdown;
        requestBody.rivalTeamExport = config.rivalTeamExport;
        requestBody.useCustomTeams = true;
      }

      console.log("🚀 Starting battle with config:", requestBody);

      // Step 1: Create battle
      const createResponse = await apiService.fetchData("/battle/start", {
        method: "POST",
        headers: apiService.getHeaders(),
        body: JSON.stringify(requestBody),
        requiresAuth: true,
      });

      const { battleId: newBattleId } = createResponse.data || createResponse;
      setBattleId(newBattleId);

      // Step 2: Initialize battle
      const initResponse = await apiService.fetchData(`/battle/initialize/${newBattleId}`, {
        method: "POST",
        headers: apiService.getHeaders(),
        requiresAuth: true,
      });

      const initData = initResponse.data || initResponse;
      setBattleLogs(initData.logs || []);
      setBattleState(initData.state === "active" ? "active" : "completed");

      processLogs(initData.logs || []);
    } catch (err) {
      console.error("Error al iniciar batalla:", err);
      setError("No se pudo iniciar la batalla. Intenta nuevamente.");
      setBattleState("idle");
    }
  };

  // Procesar logs en busca de datos de request y team preview
  const processLogs = (logs) => {
    console.log("Procesando logs:", logs);

    if (!logs || logs.length === 0) {
      console.warn("No hay logs para procesar");
      return;
    }

    // Check for team preview
    let isTeamPreviewActive = false;
    const teamPreviewData = { p1: [], p2: [] };

    // Mantener un registro de si encontramos requests para p1 y p2
    let p1RequestFound = false;
    let p2RequestFound = false;

    // Recorrer cada log recibido
    for (const log of logs) {
      // Si el log es un string vacío o no es un string, lo saltamos
      if (!log || typeof log !== "string") {
        continue;
      }

      // Check for team preview start
      if (log.includes("|teampreview")) {
        isTeamPreviewActive = true;
        console.log("🎯 Team Preview detectado!");
        setIsTeamPreview(true);
      }

      // Extract team preview pokemon
      if (isTeamPreviewActive) {
        const lines = log.split("\n");
        for (const line of lines) {
          const pokeMatch = line.match(/\|poke\|(p[12])\|([^|]+)\|(.*)$/);
          if (pokeMatch) {
            const [, player, details, item] = pokeMatch;
            const pokemon = {
              details,
              hasItem: item === "item",
              species: details.split(",")[0].trim(),
            };
            teamPreviewData[player].push(pokemon);
            console.log(`Team Preview ${player}:`, pokemon);
          }
        }
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

            // Check if this is a team preview request
            if (request.teamPreview) {
              console.log("🎯 Team Preview request detectado");
              setIsTeamPreview(true);
            }

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

    // Update team preview data if we found any
    if (teamPreviewData.p1.length > 0 || teamPreviewData.p2.length > 0) {
      setTeamPreviewPokemon(teamPreviewData);
    }

    // Check for battle start (end of team preview)
    for (const log of logs) {
      if (typeof log === "string" && log.includes("|start")) {
        setIsTeamPreview(false);
        console.log("🚀 Batalla iniciada - Team Preview terminado");
        break;
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

      // Verificar autenticación
      if (!apiService.isAuthenticated()) {
        throw new Error("No estás autenticado. Por favor, inicia sesión.");
      }

      // Añadir log de comando enviado para feedback visual inmediato
      setBattleLogs((prevLogs) => [...prevLogs, `Enviando comando: ${command}`]);

      // Enviar el comando al servidor usando apiService
      const response = await apiService.fetchData(`/battle/command/${battleId}`, {
        method: "POST",
        headers: apiService.getHeaders(),
        body: JSON.stringify({ command }),
        requiresAuth: true,
      });

      console.log("Respuesta del servidor:", response);

      const responseData = response.data || response;

      // Añadir los nuevos logs a los existentes
      if (responseData.logs && responseData.logs.length > 0) {
        console.log(`Añadiendo ${responseData.logs.length} nuevos logs:`, responseData.logs);

        // Agregar los nuevos logs
        setBattleLogs((prevLogs) => [...prevLogs, ...responseData.logs]);

        // Procesar los nuevos logs
        processLogs(responseData.logs);
      } else {
        console.warn("No se recibieron nuevos logs del servidor");

        // Si no hay logs, mostramos un mensaje informativo
        setBattleLogs((prevLogs) => [
          ...prevLogs,
          "No se recibió respuesta del servidor. La batalla puede estar esperando más acciones.",
        ]);

        // Si el comando era del jugador (p1) y no hay respuesta, probablemente necesitamos un comando de CPU
        if (command.includes("p1") && !playerForceSwitch && !cpuForceSwitch && !isTeamPreview) {
          console.log("Comando del jugador sin respuesta, probando con comando automático de CPU");

          // Esperar un momento para que el frontend se actualice
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Enviar un comando automático para la CPU (si no es team preview)
          try {
            const cpuCommand = isTeamPreview ? ">p2 team 123456" : ">p2 move 1";
            setBattleLogs((prevLogs) => [...prevLogs, `Enviando comando automático: ${cpuCommand}`]);

            const cpuResponse = await apiService.fetchData(`/battle/command/${battleId}`, {
              method: "POST",
              headers: apiService.getHeaders(),
              body: JSON.stringify({ command: cpuCommand }),
              requiresAuth: true,
            });

            if (cpuResponse.logs && cpuResponse.logs.length > 0) {
              setBattleLogs((prevLogs) => [...prevLogs, ...cpuResponse.logs]);
              processLogs(cpuResponse.logs);
              console.log("Comando automático de CPU exitoso");
            } else {
              const cpuResponseData = cpuResponse.data || cpuResponse;
              if (cpuResponseData.logs && cpuResponseData.logs.length > 0) {
                setBattleLogs((prevLogs) => [...prevLogs, ...cpuResponseData.logs]);
                processLogs(cpuResponseData.logs);
                console.log("Comando automático de CPU exitoso");
              } else {
                setBattleLogs((prevLogs) => [...prevLogs, "No se recibió respuesta al comando automático de CPU."]);
              }
            }
          } catch (cpuErr) {
            console.error("Error al enviar comando automático de CPU:", cpuErr);
            setBattleLogs((prevLogs) => [...prevLogs, `Error al enviar comando automático de CPU: ${cpuErr.message}`]);
          }
        }
      }

      // Verificar si la batalla ha terminado
      if (responseData.state === "completed") {
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
    isTeamPreview,
    teamPreviewPokemon,
  };
}
