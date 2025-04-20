// src/components/Battle/StatusMessages.jsx
import React from "react";

export function StatusMessages({ error, playerForceSwitch, cpuForceSwitch, isProcessingCommand }) {
  return (
    <>
      {error && <div className="error-message">{error}</div>}

      {playerForceSwitch && (
        <div className="force-switch-message">¡Tu Pokémon se ha debilitado! Debes elegir otro Pokémon.</div>
      )}

      {cpuForceSwitch && (
        <div className="cpu-force-switch-message">
          El Pokémon de la CPU se ha debilitado. Debes realizar la acción para la CPU.
        </div>
      )}

      {isProcessingCommand && <div className="processing-message">Procesando comando...</div>}
    </>
  );
}
