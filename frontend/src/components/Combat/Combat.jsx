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
  const [cpuWaiting, setCpuWaiting] = useState(false);
  const logContainerRef = useRef(null);

  // Iniciar una nueva batalla
  const startBattle = async () => {
    try {
      setBattleState("loading");
      setError(null);
      setBattleLogs([]);
      setRequestData(null);
      setPlayerForceSwitch(false);
      setCpuWaiting(false);

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

    // Recorrer cada log recibido
    for (const log of logs) {
      // Dividir por líneas para buscar el request en cualquier parte del mensaje
      const lines = log.split("\n");

      // Buscar la línea que contiene |request|
      for (const line of lines) {
        if (line.includes("|request|")) {
          try {
            // Extraer el JSON que viene después de |request|
            const requestJson = line.substring(line.indexOf("|request|") + "|request|".length);
            console.log("REQUEST JSON encontrado:", requestJson);

            const request = JSON.parse(requestJson);
            console.log("REQUEST parseado:", request);

            setRequestData(request);

            // Comprobar si el jugador está forzado a cambiar de Pokémon
            if (request.forceSwitch && request.forceSwitch[0] === true) {
              setPlayerForceSwitch(true);
              setCpuWaiting(true);
            } else {
              setPlayerForceSwitch(false);
            }

            // Comprobar si hay un campo 'wait' para la CPU
            if (request.wait === true) {
              setCpuWaiting(true);
            } else {
              setCpuWaiting(false);
            }

            // Una vez encontrado y procesado el request, podemos salir
            return;
          } catch (e) {
            console.error("Error al procesar request:", e, "en línea:", line);
          }
        }
      }
    }
  };

  // Enviar un comando a la batalla
  const sendCommand = async (command) => {
    if (battleState !== "active" || !battleId) {
      setError("No hay una batalla activa");
      return;
    }

    try {
      setError(null);
      const response = await API.post(`/battle/command/${battleId}`, { command });

      // Añadir los nuevos logs a los existentes
      setBattleLogs((prevLogs) => [...prevLogs, ...response.data.logs]);

      // Procesar los nuevos logs
      processLogs(response.data.logs);

      // Verificar si la batalla ha terminado
      if (response.data.state === "completed") {
        setBattleState("completed");
      }
    } catch (err) {
      console.error("Error al enviar comando:", err);
      setError("Error al enviar comando. Intenta nuevamente.");
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

  // Renderizar los botones de movimientos basados en el estado actual
  const renderMoveButtons = () => {
    if (!requestData || !requestData.active || playerForceSwitch) {
      console.log("No se pueden mostrar movimientos:", {
        requestData: !!requestData,
        active: requestData?.active ? true : false,
        forceSwitch: playerForceSwitch,
      });
      return null;
    }

    const moves = requestData.active[0]?.moves || [];

    if (moves.length === 0) {
      console.log("No hay movimientos disponibles en el REQUEST", requestData);
      return <div>No hay movimientos disponibles</div>;
    }

    console.log("Movimientos disponibles:", moves);

    return (
      <div className="control-row">
        {moves.map((move, index) => (
          <button
            key={index}
            onClick={() => sendCommand(`>p1 move ${index + 1}`)}
            disabled={move.disabled}
            className={move.disabled ? "disabled" : ""}
            title={move.disabled ? "Movimiento deshabilitado" : move.move}
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
      console.log("No se pueden mostrar Pokémon:", {
        requestData: !!requestData,
        side: requestData?.side ? true : false,
        pokemon: requestData?.side?.pokemon ? true : false,
      });
      return null;
    }

    console.log("Pokémon disponibles:", requestData.side.pokemon);

    return (
      <div className="control-row">
        {requestData.side.pokemon.map((pokemon, index) => {
          const isActive = pokemon.active;
          const isFainted = pokemon.condition.includes("fnt");
          const isDisabled = isActive || isFainted;

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
              title={isActive ? "Pokémon activo" : isFainted ? "Pokémon debilitado" : `Cambiar a ${pokemonName}`}
            >
              {pokemonName} - {condition}
            </button>
          );
        })}
      </div>
    );
  };

  // Renderizar un log más leíble en la interfaz
  const renderFormattedLog = (log) => {
    const lines = log.split("\n");
    return lines.map((line, index) => {
      // Formatear las líneas para que sean más legibles
      if (line.startsWith("|")) {
        const parts = line.split("|");
        if (parts.length >= 3) {
          // Formatear diferentes tipos de mensajes
          if (parts[1] === "move") {
            return <div key={index} className="log-move">{`${parts[2]} usó ${parts[3]}`}</div>;
          } else if (parts[1] === "damage" || parts[1] === "-damage") {
            return <div key={index} className="log-damage">{`${parts[2]} recibió daño (${parts[3]})`}</div>;
          } else if (parts[1] === "switch" || parts[1] === "drag") {
            return <div key={index} className="log-switch">{`${parts[2]} entró al campo`}</div>;
          } else if (parts[1] === "faint") {
            return <div key={index} className="log-faint">{`${parts[2]} se debilitó`}</div>;
          }
        }
      }
      // Para líneas que no se formatean específicamente
      return <div key={index}>{line}</div>;
    });
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

      {cpuWaiting && <div className="cpu-waiting-message">La CPU está esperando tu acción.</div>}

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
              {playerForceSwitch ? "Debes elegir un nuevo Pokémon" : "Elige tu próxima acción"}
            </div>

            {/* Botones de team preview si estamos en esa fase */}
            {requestData && requestData.teamPreview && (
              <div className="control-row">
                <button onClick={() => sendCommand(">p1 team 123456")}>Team Preview (123456)</button>
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

          <div className="custom-command-section">
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Comando personalizado (ej: >p1 move 1)"
            />
            <button onClick={handleCustomCommand}>Enviar</button>
          </div>

          {/* Panel de desarrollo para depuración */}
          <div className="debug-panel">
            <h4>Panel de Depuración</h4>
            <button onClick={() => console.log("Request Data:", requestData)}>Ver REQUEST en consola</button>
            <button onClick={() => console.log("Battle Logs:", battleLogs)}>Ver LOGS en consola</button>
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
