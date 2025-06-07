// src/components/Combat/Combat.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBattle } from "../../hooks/useBattle";
import { BattleField } from "./BattleField";
import { StatusMessages } from "../Battle/StatusMessages";
import { BattleControls } from "../Battle/BattleControls";
import { BattleMessages } from "../Battle/BattleMessages";
import { CustomCommandInput } from "../Battle/CustomCommandInput";
import { DebugPanel } from "../Battle/DebugPanel";
import { BattleLogViewer } from "../Battle/LogViewer";
import { TeamPreview } from "../Battle/TeamPreview";
import "../../styles/Battle/Combat.css";
import "../../styles/Battle/BattleField.css";
import "../../styles/Battle/BattleMessages.css";

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
    isTeamPreview,
    teamPreviewPokemon,
  } = useBattle();

  // Estado para alternar entre vista normal y debug
  const [showDebugMode, setShowDebugMode] = useState(false);

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
  }, [battleState, navigate]);

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
          <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
          <p>Building battle...</p>
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
          <h2>Error when building the battle</h2>
          <p>The battle could not be started. It is possible that the configuration is missing.</p>
          <div className="error-actions">
            <button onClick={goBackToSetup} className="back-button">
              Return
            </button>
            <button onClick={() => window.location.reload()} className="retry-button">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Team Preview as a separate full-screen component
  if (battleState === "active" && isTeamPreview) {
    return (
      <div className="combat-container">
        <h1>Battle Simulator</h1>

        <div className="battle-status">
          <div className="battle-info">
            {battleConfig && (
              <>
                <span className={`battle-format difficulty-${battleConfig.difficulty?.toLowerCase() || "unknown"}`}>
                  {battleConfig.difficulty
                    ? battleConfig.difficulty.charAt(0).toUpperCase() + battleConfig.difficulty.slice(1)
                    : "Desconocida"}{" "}
                  mode
                </span>
              </>
            )}
          </div>
        </div>

        {/* Team Preview as independent component */}
        <div className="team-preview-wrapper">
          <TeamPreview
            requestData={requestData}
            teamPreviewPokemon={teamPreviewPokemon}
            onSendCommand={sendCommand}
            isProcessingCommand={isProcessingCommand}
          />
        </div>
      </div>
    );
  }

  // Resto del componente para cuando la batalla está activa o completada
  return (
    <div className="combat-container">
      <h1>Battle Simulator</h1>

      <div className="battle-status">
        <div className="battle-info">
          {battleConfig && (
            <>
              <span className={`battle-format difficulty-${battleConfig.difficulty?.toLowerCase() || "unknown"}`}>
                {battleConfig.difficulty
                  ? battleConfig.difficulty.charAt(0).toUpperCase() + battleConfig.difficulty.slice(1)
                  : "Desconocida"}{" "}
                mode
              </span>
            </>
          )}
        </div>
      </div>

      {/* Contenido principal: Campo de batalla y mensajes lado a lado */}
      {battleState === "active" && (
        <div className="battle-main-content">
          {showDebugMode ? (
            // Vista Debug: Solo logs
            <div className="debug-view">
              <BattleLogViewer logs={battleLogs} isLoading={battleState === "loading"} />
            </div>
          ) : (
            // Vista Normal: Campo de batalla y mensajes lado a lado
            <div className="battle-split-view">
              <div className="battle-field-container">
                <BattleField logs={battleLogs} requestData={requestData} isLoading={battleState === "loading"} />
              </div>
              <div className="battle-messages-container">
                <BattleMessages logs={battleLogs} isTeamPreview={isTeamPreview} />
              </div>
              {battleState === "active" && (
                <div className="battle-controls">
                  <BattleControls
                    requestData={requestData}
                    playerForceSwitch={playerForceSwitch}
                    cpuForceSwitch={cpuForceSwitch}
                    isProcessingCommand={isProcessingCommand}
                    onSendCommand={sendCommand}
                    isTeamPreview={isTeamPreview}
                  />

                  {/* Panel de debug - solo si no estamos en team preview y estamos en modo debug */}
                  {!isTeamPreview && showDebugMode && (
                    <DebugPanel
                      requestData={requestData}
                      battleLogs={battleLogs}
                      playerForceSwitch={playerForceSwitch}
                      cpuForceSwitch={cpuForceSwitch}
                      isProcessingCommand={isProcessingCommand}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {battleState === "completed" && (
        <div className="battle-complete">
          <h2>¡La batalla ha finalizado!</h2>

          {/* Mostrar mensajes finales incluso cuando la batalla haya terminado */}
          <div className="battle-split-view">
            <div className="battle-field-container">
              <BattleField logs={battleLogs} requestData={requestData} isLoading={false} />
            </div>
            <div className="battle-messages-container">
              <BattleMessages logs={battleLogs} isTeamPreview={false} />
            </div>
          </div>

          <div className="battle-complete-actions">
            <button onClick={goBackToSetup}>Go Back</button>
            <button onClick={() => handleStartBattle(battleConfig)}>Repeat the Battle</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Combat;
