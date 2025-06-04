// src/components/Combat/Combat.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBattle } from "../../hooks/useBattle";
import { BattleField } from "./BattleField";
import { StatusMessages } from "../Battle/StatusMessages";
import { BattleControls } from "../Battle/BattleControls";
import { BattleMessages } from "../Battle/BattleMessages"; // Componente mejorado
import { CPUControls } from "../Battle/CPUControls";
import { CustomCommandInput } from "../Battle/CustomCommandInput";
import { DebugPanel } from "../Battle/DebugPanel";
import { BattleLogViewer } from "../Battle/LogViewer";
import "../../styles/Battle/Combat.css";
import "../../styles/Battle/BattleField.css";
import "../../styles/Battle/BattleMessages.css"; // Nuevos estilos

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

  // Estado para alternar entre la vista de campo de batalla y logs (para debugging)
  const [showLogs, setShowLogs] = useState(false);
  // Nuevo estado para alternar entre vista de campo y mensajes parseados
  const [viewMode, setViewMode] = useState("field"); // "field", "messages", "logs"

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

  // Función para cambiar el modo de vista
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
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

  // Función para renderizar el contenido principal según el modo de vista
  const renderMainContent = () => {
    if (isTeamPreview) {
      return (
        <div className="team-preview-area">
          <p>Selecciona el orden de tu equipo para comenzar la batalla.</p>
        </div>
      );
    }

    switch (viewMode) {
      case "messages":
        return <BattleMessages logs={battleLogs} isTeamPreview={isTeamPreview} />;
      case "logs":
        return <BattleLogViewer logs={battleLogs} isLoading={battleState === "loading"} />;
      case "field":
      default:
        return <BattleField logs={battleLogs} requestData={requestData} isLoading={battleState === "loading"} />;
    }
  };

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
          {isTeamPreview && <span className="team-preview-indicator">🔍 Vista Previa de Equipos</span>}
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

        {/* Botones mejorados para alternar entre vistas */}
        {battleState === "active" && !isTeamPreview && (
          <div className="view-mode-selector">
            <button
              className={`view-button ${viewMode === "field" ? "active" : ""}`}
              onClick={() => handleViewModeChange("field")}
            >
              🏟️ Campo
            </button>
            <button
              className={`view-button ${viewMode === "messages" ? "active" : ""}`}
              onClick={() => handleViewModeChange("messages")}
            >
              📜 Mensajes
            </button>
            <button
              className={`view-button ${viewMode === "logs" ? "active" : ""}`}
              onClick={() => handleViewModeChange("logs")}
            >
              🔧 Debug
            </button>
          </div>
        )}
      </div>

      <StatusMessages
        error={error}
        playerForceSwitch={playerForceSwitch}
        cpuForceSwitch={cpuForceSwitch}
        isProcessingCommand={isProcessingCommand}
      />

      {/* Renderizar el contenido principal según el modo seleccionado */}
      {renderMainContent()}

      {battleState === "active" && (
        <div className="battle-controls">
          <BattleControls
            requestData={requestData}
            playerForceSwitch={playerForceSwitch}
            cpuForceSwitch={cpuForceSwitch}
            isProcessingCommand={isProcessingCommand}
            onSendCommand={sendCommand}
            isTeamPreview={isTeamPreview}
            teamPreviewPokemon={teamPreviewPokemon}
          />

          {/* Controles de la CPU para testing - solo si no estamos en team preview */}
          {cpuForceSwitch && !isTeamPreview && <CPUControls onSendCommand={sendCommand} />}

          {/* Input de comando personalizado - solo si no estamos en team preview */}
          {!isTeamPreview && <CustomCommandInput onSendCommand={sendCommand} disabled={isProcessingCommand} />}

          {/* Panel de debug - solo si no estamos en team preview y estamos en modo debug */}
          {!isTeamPreview && viewMode === "logs" && (
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

      {battleState === "completed" && (
        <div className="battle-complete">
          <h2>¡La batalla ha finalizado!</h2>

          {/* Mostrar mensajes finales incluso cuando la batalla haya terminado */}
          <BattleMessages logs={battleLogs} isTeamPreview={false} />

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
