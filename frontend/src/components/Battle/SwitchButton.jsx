// src/components/Battle/SwitchButton.jsx
import React from "react";

export function SwitchButton({ pokemon, index, disabled, isProcessing, onExecute }) {
  const isActive = pokemon.active;
  const isFainted = pokemon.condition.includes("fnt");
  const isDisabled = isActive || isFainted || disabled;

  // Extraer el nombre del Pokémon y condición
  const pokemonName = pokemon.details.split(",")[0];
  const condition = pokemon.condition;

  return (
    <button
      onClick={() => onExecute(`>p1 switch ${index + 1}`)}
      disabled={isDisabled}
      className={isDisabled ? "disabled" : ""}
      title={
        isProcessing
          ? "Procesando comando anterior..."
          : disabled
          ? "Debes esperar a que la CPU cambie de Pokémon"
          : isActive
          ? "Pokémon activo"
          : isFainted
          ? "Pokémon debilitado"
          : `Cambiar a ${pokemonName}`
      }
    >
      {pokemonName} - {condition}
    </button>
  );
}
