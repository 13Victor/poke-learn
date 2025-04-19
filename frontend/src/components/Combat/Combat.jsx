import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Combat.css";

// Configurar axios para que apunte al backend
const API = axios.create({
  baseURL: "http://localhost:5000/",
  headers: {
    "Content-Type": "application/json",
  },
});

const Combat = () => {
  const [battleId, setBattleId] = useState(null);
  const [battleState, setBattleState] = useState("idle"); // idle, loading, active, completed
  const [battleLogs, setBattleLogs] = useState([]);
  const [customCommand, setCustomCommand] = useState("");
  const [error, setError] = useState(null);
  const [format, setFormat] = useState("gen7randombattle");
  const [requestData, setRequestData] = useState(null);
  const [playerForceSwitch, setPlayerForceSwitch] = useState(false);
  const [cpuForceSwitch, setCpuForceSwitch] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const logContainerRef = useRef(null);

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

  // Función para enviar un comando personalizado
  const handleCustomCommand = () => {
    if (customCommand.trim()) {
      sendCommand(customCommand.trim());
      setCustomCommand("");
    }
  };

  // Función para manejar la tecla Enter en el campo de texto
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCustomCommand();
    }
  };

  // Auto-scroll para el log de batalla
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [battleLogs]);

  // Verificar si los controles deben estar deshabilitados
  const areControlsDisabled = cpuForceSwitch || isProcessingCommand;

  // Renderizar los botones de movimientos basados en el estado actual
  const renderMoveButtons = () => {
    if (!requestData || !requestData.active || playerForceSwitch) {
      return null;
    }

    const moves = requestData.active[0]?.moves || [];

    if (moves.length === 0) {
      return <div>No hay movimientos disponibles</div>;
    }

    return (
      <div className="control-row">
        {moves.map((move, index) => (
          <button
            key={index}
            onClick={() => sendCommand(`>p1 move ${index + 1}`)}
            disabled={move.disabled || areControlsDisabled}
            className={move.disabled || areControlsDisabled ? "disabled" : ""}
            title={
              isProcessingCommand
                ? "Procesando comando anterior..."
                : areControlsDisabled
                ? "Debes esperar a que la CPU cambie de Pokémon"
                : move.disabled
                ? "Movimiento deshabilitado"
                : move.move
            }
          >
            {move.move}
          </button>
        ))}
      </div>
    );
  };

  // Renderizar los botones de cambio basados en el estado actual
  const renderSwitchButtons = () => {
    if (!requestData || !requestData.side || !requestData.side.pokemon) {
      return null;
    }

    return (
      <div className="control-row">
        {requestData.side.pokemon.map((pokemon, index) => {
          const isActive = pokemon.active;
          const isFainted = pokemon.condition.includes("fnt");
          // Solo deshabilitar si está activo, debilitado o si la CPU debe cambiar y el jugador no está forzado
          const isDisabled = isActive || isFainted || (areControlsDisabled && !playerForceSwitch);

          // Extraer el nombre del Pokémon de los detalles
          const pokemonName = pokemon.details.split(",")[0];
          // Extraer la condición actual (HP)
          const condition = pokemon.condition;

          return (
            <button
              key={index}
              onClick={() => sendCommand(`>p1 switch ${index + 1}`)}
              disabled={isDisabled}
              className={isDisabled ? "disabled" : ""}
              title={
                isProcessingCommand
                  ? "Procesando comando anterior..."
                  : areControlsDisabled && !playerForceSwitch
                  ? "Debes esperar a que la CPU cambie de Pokémon"
                  : isActive
                  ? "Pokémon activo"
                  : isFainted
                  ? "Pokémon debilitado"
                  : `Cambiar a ${pokemonName}`
              }
            >
              {pokemonName} - {condition}
            </button>
          );
        })}
      </div>
    );
  };

  // Renderizar los controles para la CPU (para testing)
  const renderCPUControls = () => {
    if (!cpuForceSwitch) return null;

    return (
      <div className="cpu-controls">
        <h4>Controles de la CPU (Testing)</h4>
        <div className="control-row">
          <button onClick={() => sendCommand("p2 switch 2")}>CPU: Cambiar a 2</button>
          <button onClick={() => sendCommand("p2 switch 3")}>CPU: Cambiar a 3</button>
          <button onClick={() => sendCommand("p2 switch 4")}>CPU: Cambiar a 4</button>
        </div>
      </div>
    );
  };

  return (
    <div className="combat-container">
      <h1>Simulador de Batalla Pokémon</h1>

      <div className="battle-status">
        <div className="format-selector">
          <label htmlFor="format-select">Formato: </label>
          <select
            id="format-select"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            disabled={battleState === "active" || battleState === "loading"}
          >
            <option value="gen7randombattle">Gen 7 Random Battle</option>
            <option value="gen8randombattle">Gen 8 Random Battle</option>
            <option value="gen9randombattle">Gen 9 Random Battle</option>
          </select>
        </div>

        <button className="start-button" onClick={startBattle} disabled={battleState === "loading"}>
          {battleState === "loading" ? "Iniciando..." : "Nueva Batalla"}
        </button>

        <span className={`status-indicator ${battleState}`}>
          {battleState === "idle"
            ? "Sin batalla"
            : battleState === "loading"
            ? "Cargando..."
            : battleState === "active"
            ? "En curso"
            : "Finalizada"}
        </span>
      </div>

      {error && <div className="error-message">{error}</div>}

      {playerForceSwitch && (
        <div className="force-switch-message">¡Tu Pokémon se ha debilitado! Debes elegir otro Pokémon.</div>
      )}

      {cpuForceSwitch && (
        <div className="cpu-force-switch-message">
          El Pokémon de la CPU se ha debilitado. Debes realizar la acción para la CPU.
        </div>
      )}

      {isProcessingCommand && <div className="processing-message">Procesando comando...</div>}

      <div className="battle-area" ref={logContainerRef}>
        {battleLogs.length > 0 ? (
          battleLogs.map((log, index) => (
            <pre key={index} className="log-message">
              {log}
            </pre>
          ))
        ) : (
          <p>{battleState === "loading" ? "Cargando batalla..." : "Inicia una batalla para comenzar"}</p>
        )}
      </div>

      {battleState === "active" && (
        <div className="battle-controls">
          <div className="player-section">
            <h3>Controles del Jugador</h3>

            {/* Mostrar mensaje sobre qué acción se requiere */}
            <div className="action-required">
              {playerForceSwitch
                ? "Debes elegir un nuevo Pokémon"
                : cpuForceSwitch
                ? "Debes realizar la acción para la CPU"
                : "Elige tu próxima acción"}
            </div>

            {/* Botones de team preview si estamos en esa fase */}
            {requestData && requestData.teamPreview && (
              <div className="control-row">
                <button onClick={() => sendCommand("p1 team 123456")}>Team Preview (123456)</button>
              </div>
            )}

            {/* Botones de movimientos solo si no estamos forzados a cambiar */}
            {!playerForceSwitch && (
              <>
                <h4>Movimientos</h4>
                {renderMoveButtons()}
              </>
            )}

            {/* Botones de cambio siempre visibles, pero inhabilitados según el estado */}
            <h4>Cambiar Pokémon</h4>
            {renderSwitchButtons()}
          </div>

          {/* Controles de la CPU para testing */}
          {cpuForceSwitch && renderCPUControls()}

          <div className="custom-command-section">
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Comando personalizado (ej: p1 move 1)"
              disabled={isProcessingCommand}
            />
            <button onClick={handleCustomCommand} disabled={isProcessingCommand}>
              Enviar
            </button>
          </div>

          {/* Panel de desarrollo para depuración */}
          <div className="debug-panel">
            <h4>Panel de Depuración</h4>
            <button onClick={() => console.log("Request Data:", requestData)}>Ver REQUEST en consola</button>
            <button onClick={() => console.log("Battle Logs:", battleLogs)}>Ver LOGS en consola</button>
            <div className="debug-status">
              <p>
                Estado Jugador:
                <span className={playerForceSwitch ? "status-warning" : "status-normal"}>
                  {playerForceSwitch ? "Forzado a cambiar" : "Normal"}
                </span>
              </p>
              <p>
                Estado CPU:
                <span className={cpuForceSwitch ? "status-waiting" : "status-normal"}>
                  {cpuForceSwitch ? "Forzado a cambiar" : "Normal"}
                </span>
              </p>
              <p>
                Procesando:
                <span className={isProcessingCommand ? "status-waiting" : "status-normal"}>
                  {isProcessingCommand ? "Sí" : "No"}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {battleState === "completed" && (
        <div className="battle-complete">
          <p>¡La batalla ha finalizado!</p>
          <button onClick={startBattle}>Iniciar Nueva Batalla</button>
        </div>
      )}
    </div>
  );
};

export default Combat;
