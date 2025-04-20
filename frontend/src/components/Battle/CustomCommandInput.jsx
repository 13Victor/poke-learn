// src/components/Battle/CustomCommandInput.jsx
import React, { useState } from "react";

export function CustomCommandInput({ onSendCommand, disabled }) {
  const [command, setCommand] = useState("");

  const handleSend = () => {
    if (command.trim()) {
      onSendCommand(command.trim());
      setCommand("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="custom-command-section">
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Comando personalizado (ej: >p1 move 1)"
        disabled={disabled}
      />
      <button onClick={handleSend} disabled={disabled}>
        Enviar
      </button>
    </div>
  );
}
