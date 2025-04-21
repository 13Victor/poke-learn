// src/components/Battle/BattleLogViewer.jsx
import React, { useEffect, useRef } from "react";

export function BattleLogViewer({ logs, isLoading }) {
  const logContainerRef = useRef(null);

  console.log("BattleLogViewer logs:", logs); // Debugging line

  // Auto-scroll para el log de batalla
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="battle-area" ref={logContainerRef}>
      {logs.length > 0 ? (
        logs.map((log, index) => (
          <pre key={index} className="log-message">
            {log}
          </pre>
        ))
      ) : (
        <p>{isLoading ? "Cargando batalla..." : "Inicia una batalla para comenzar"}</p>
      )}
    </div>
  );
}
