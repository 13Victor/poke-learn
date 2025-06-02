// src/components/Combat/Combat.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBattle } from "../../hooks/useBattle";
import { BattleField } from "./BattleField";
import { StatusMessages } from "../Battle/StatusMessages";
import { BattleControls } from "../Battle/BattleControls";
import { CPUControls } from "../Battle/CPUControls";
import { CustomCommandInput } from "../Battle/CustomCommandInput";
import { DebugPanel } from "../Battle/DebugPanel";
import { BattleLogViewer } from "../Battle/LogViewer";
import "../../styles/Battle/Combat.css";
import "../../styles/Battle/BattleField.css";

const Combat = () => {
  const navigate = useNavigate();
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

  // Auto-iniciar la batalla cuando el componente se monte
  useEffect(() => {
    // Solo auto-iniciar si no hay batalla activa y hay configuración guardada
    if (battleState === "idle") {
      const savedConfig = localStorage.getItem("battleConfig");

      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          console.log("🚀 Auto-iniciando batalla con configuración guardada:", config);

          setBattleConfig(config);

          // Iniciar la batalla automáticamente
          handleStartBattle(config);
        } catch (error) {
          console.error("❌ Error al parsear configuración de batalla:", error);
          // Si hay error, redirigir de vuelta a setup
          navigate("/battle");
        }
      } else {
        console.log("⚠️ No hay configuración de batalla guardada, redirigiendo a setup");
        // Si no hay configuración, redirigir a setup
        navigate("/battle");
      }
    }
  }, [battleState, navigate]); // Dependencias para re-ejecutar cuando cambie el estado

  // Función para manejar el inicio de batalla
  const handleStartBattle = (config) => {
    setBattleConfig(config);
    console.log("Configuración de batalla seleccionada:", config);

    // Get battle config from localStorage if not provided
    const savedConfig = config || JSON.parse(localStorage.getItem("battleConfig") || "{}");

    if (savedConfig.playerTeamShowdown && savedConfig.rivalTeamExport) {
      console.log("🎯 Starting battle with custom teams");
      console.log("Player team:", savedConfig.playerTeamShowdown);
      console.log("Rival team (export format):", savedConfig.rivalTeamExport);
    }

    // Start battle with custom teams
    startBattle(savedConfig);
  };

  // Función para volver a la configuración
  const goBackToSetup = () => {
    // Limpiar configuración guardada
    localStorage.removeItem("battleConfig");
    navigate("/battle");
  };

  // Si estamos cargando, mostrar estado de carga
  if (battleState === "loading") {
    return (
      <div className="combat-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Iniciando batalla...</p>
          <button onClick={goBackToSetup} className="back-button">
            Volver a Configuración
          </button>
        </div>
      </div>
    );
  }

  // Si hay un error crítico o no hay configuración, mostrar opciones
  if (battleState === "idle" && !battleConfig) {
    return (
      <div className="combat-container">
        <div className="error-container">
          <h2>Error al Iniciar Batalla</h2>
          <p>No se pudo iniciar la batalla. Es posible que falte la configuración.</p>
          <div className="error-actions">
            <button onClick={goBackToSetup} className="back-button">
              Volver a Configuración
            </button>
            <button onClick={() => window.location.reload()} className="retry-button">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Resto del componente para cuando la batalla está activa o completada
  return (
    <div className="combat-container">
      <h1>Simulador de Batalla Pokémon</h1>

      <div className="battle-status">
        <div className="battle-info">
          <span>Formato: {format}</span>
          {battleConfig && (
            <>
              <span>Equipo: {battleConfig.team?.name || "Personalizado"}</span>
              <span>
                Dificultad:{" "}
                {battleConfig.difficulty === "easy"
                  ? "Fácil"
                  : battleConfig.difficulty === "medium"
                  ? "Media"
                  : "Difícil"}
              </span>
            </>
          )}
        </div>

        <div className="battle-actions">
          <button className="back-button" onClick={goBackToSetup}>
            Volver a Configuración
          </button>

          <button
            className="start-button"
            onClick={() => handleStartBattle(battleConfig)}
            disabled={battleState === "loading"}
          >
            {battleState === "loading" ? "Iniciando..." : "Nueva Batalla"}
          </button>
        </div>

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
            <button onClick={goBackToSetup}>Configurar Nueva Batalla</button>
            <button onClick={() => handleStartBattle(battleConfig)}>Repetir con Misma Configuración</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Combat;
