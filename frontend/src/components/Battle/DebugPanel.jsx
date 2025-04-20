// src/components/Battle/DebugPanel.jsx
import React from "react";

export function DebugPanel({ requestData, battleLogs, playerForceSwitch, cpuForceSwitch, isProcessingCommand }) {
  return (
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
  );
}
