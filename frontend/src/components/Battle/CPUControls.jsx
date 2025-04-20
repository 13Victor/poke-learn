// src/components/Battle/CPUControls.jsx
import React from "react";

export function CPUControls({ onSendCommand }) {
  return (
    <div className="cpu-controls">
      <h4>Controles de la CPU (Testing)</h4>
      <div className="control-row">
        <button onClick={() => onSendCommand(">p2 switch 2")}>CPU: Cambiar a 2</button>
        <button onClick={() => onSendCommand(">p2 switch 3")}>CPU: Cambiar a 3</button>
        <button onClick={() => onSendCommand(">p2 switch 4")}>CPU: Cambiar a 4</button>
      </div>
    </div>
  );
}
