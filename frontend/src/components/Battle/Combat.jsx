// src/components/Combat/Combat.jsx
import React from "react";
import { useBattle } from "../../hooks/useBattle";
import { BattleLogViewer } from "./LogViewer";
import { StatusMessages } from "./StatusMessages";
import { BattleControls } from "./BattleControls";
import { CPUControls } from "./CPUControls";
import { CustomCommandInput } from "./CustomCommandInput";
import { DebugPanel } from "./DebugPanel";
import "../../styles/Combat.css";

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

      <StatusMessages
        error={error}
        playerForceSwitch={playerForceSwitch}
        cpuForceSwitch={cpuForceSwitch}
        isProcessingCommand={isProcessingCommand}
      />

      <BattleLogViewer logs={battleLogs} isLoading={battleState === "loading"} />

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
          <button onClick={startBattle}>Iniciar Nueva Batalla</button>
        </div>
      )}
    </div>
  );
};

export default Combat;
