// src/components/Combat/Combat.jsx
import React, { useState } from "react";
import { useBattle } from "../../hooks/useBattle";
import { BattleField } from "./BattleField";
import { StatusMessages } from "../Battle/StatusMessages";
import { BattleControls } from "../Battle/BattleControls";
import { CPUControls } from "../Battle/CPUControls";
import { CustomCommandInput } from "../Battle/CustomCommandInput";
import { DebugPanel } from "../Battle/DebugPanel";
import { BattleLogViewer } from "../Battle/LogViewer";
import BattleSetup from "../Battle/BattleSetup";
import "../../styles/Battle/Combat.css";
import "../../styles/Battle/BattleField.css";

const Combat = () => {
  const {
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
  } = useBattle();

  // Estado para alternar entre la vista de campo de batalla y logs (para debugging)
  const [showLogs, setShowLogs] = useState(false);

  // Estado para manejar la configuración de batalla seleccionada
  const [battleConfig, setBattleConfig] = useState(null);

  // Función para manejar el inicio de batalla desde BattleSetup
  const handleStartBattle = (config) => {
    setBattleConfig(config);
    // Guardar la configuración para usar más adelante si es necesario
    console.log("Configuración de batalla seleccionada:", config);

    // Iniciar la batalla
    startBattle();
  };

  // Si no hay batalla activa ni completada, mostrar la pantalla de configuración
  if (battleState === "idle") {
    return (
      <div className="combat-container">
        <BattleSetup onStartBattle={handleStartBattle} format={format} setFormat={setFormat} />
      </div>
    );
  }

  // Resto del componente para cuando la batalla está activa
  return (
    <div className="combat-container">
      <h1>Simulador de Batalla Pokémon</h1>

      <div className="battle-status">
        <div className="battle-info">
          <span>Formato: {format}</span>
          {battleConfig && (
            <>
              <span>Equipo: {battleConfig.team.name}</span>
              <span>Dificultad: {battleConfig.difficulty === "easy" ? "Fácil" : battleConfig.difficulty}</span>
            </>
          )}
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

        {/* Botón para alternar entre vista de campo y logs */}
        {battleState === "active" && (
          <button className="toggle-view-button" onClick={() => setShowLogs(!showLogs)}>
            {showLogs ? "Ver Campo de Batalla" : "Ver Logs (Debug)"}
          </button>
        )}
      </div>

      <StatusMessages
        error={error}
        playerForceSwitch={playerForceSwitch}
        cpuForceSwitch={cpuForceSwitch}
        isProcessingCommand={isProcessingCommand}
      />

      {/* Mostrar el campo de batalla o los logs según el estado */}
      {showLogs ? (
        <BattleLogViewer logs={battleLogs} isLoading={battleState === "loading"} />
      ) : (
        <BattleField logs={battleLogs} requestData={requestData} isLoading={battleState === "loading"} />
      )}

      {battleState === "active" && (
        <div className="battle-controls">
          <BattleControls
            requestData={requestData}
            playerForceSwitch={playerForceSwitch}
            cpuForceSwitch={cpuForceSwitch}
            isProcessingCommand={isProcessingCommand}
            onSendCommand={sendCommand}
          />

          {/* Controles de la CPU para testing */}
          {cpuForceSwitch && <CPUControls onSendCommand={sendCommand} />}

          <CustomCommandInput onSendCommand={sendCommand} disabled={isProcessingCommand} />

          <DebugPanel
            requestData={requestData}
            battleLogs={battleLogs}
            playerForceSwitch={playerForceSwitch}
            cpuForceSwitch={cpuForceSwitch}
            isProcessingCommand={isProcessingCommand}
          />
        </div>
      )}

      {battleState === "completed" && (
        <div className="battle-complete">
          <p>¡La batalla ha finalizado!</p>
          <div className="battle-complete-actions">
            <button onClick={() => window.location.reload()}>Configurar Nueva Batalla</button>
            <button onClick={startBattle}>Repetir con Misma Configuración</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Combat;
