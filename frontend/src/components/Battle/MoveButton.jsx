// src/components/Battle/MoveButton.jsx
import React from "react";

export function MoveButton({ move, index, disabled, isProcessing, onExecute }) {
  return (
    <button
      onClick={() => onExecute(`>p1 move ${index + 1}`)}
      disabled={move.disabled || disabled}
      className={move.disabled || disabled ? "disabled" : ""}
      title={
        isProcessing
          ? "Procesando comando anterior..."
          : disabled
          ? "Debes esperar a que la CPU cambie de Pokémon"
          : move.disabled
          ? "Movimiento deshabilitado"
          : move.move
      }
    >
      {move.move}
    </button>
  );
}
