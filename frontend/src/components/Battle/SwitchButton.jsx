// src/components/Battle/SwitchButton.jsx
import React from "react";

export function SwitchButton({ pokemon, index, disabled, isProcessing, onExecute }) {
  const isActive = pokemon.active;
  const isFainted = pokemon.condition.includes("fnt");
  const isDisabled = isActive || isFainted || disabled;

  // Extraer el nombre del Pokémon y condición
  const pokemonName = pokemon.details.split(",")[0];
  const condition = pokemon.condition;

  // Calcular el porcentaje de HP
  const calculateHPPercentage = () => {
    if (isFainted) return 0;

    // Formato: "100/100" o "50/100" o "fnt"
    if (condition.includes("/")) {
      const [current, max] = condition.split("/").map((num) => parseInt(num.trim()));
      return Math.max(0, Math.min(100, (current / max) * 100));
    }

    // Si no hay formato de fracción, asumir 100%
    return 100;
  };

  const hpPercentage = calculateHPPercentage();

  // Obtener color de la barra de HP basado en el porcentaje
  const getHPBarColor = () => {
    if (hpPercentage > 50) return "#4CAF50"; // Verde
    if (hpPercentage > 25) return "#FF9800"; // Naranja
    return "#F44336"; // Rojo
  };

  // Generar URL de la imagen del Pokémon usando la misma fuente que BattleField
  const getPokemonImageUrl = () => {
    if (!pokemonName) return null;

    // Formatear el nombre para la URL de Pokémon Showdown (igual que en BattleField)
    const formattedName = pokemonName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") // Remove special characters
      .replace(/\s+/g, ""); // Remove spaces

    return `https://play.pokemonshowdown.com/sprites/home/${formattedName}.png`;
  };

  return (
    <button
      onClick={() => onExecute(`>p1 switch ${index + 1}`)}
      disabled={isDisabled}
      className={`switch-button ${isDisabled ? "disabled" : ""} ${isActive ? "active" : ""} ${
        isFainted ? "fainted" : ""
      }`}
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
      {isFainted && <div className="fainted-overlay">Fainted</div>}

      <div className="switch-button-content">
        {/* Imagen del Pokémon */}
        <div className="pokemon-image-container">
          <img
            src={getPokemonImageUrl()}
            alt={pokemonName}
            className="pokemon-image"
            onError={(e) => {
              // Fallback a una imagen genérica si no se puede cargar (igual que en BattleField)
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/64x64?text=?";
            }}
          />
        </div>

        {/* Información del Pokémon */}
        <div className="pokemon-name">{pokemonName}</div>

        {/* Barra de HP */}
        <div className="hp-bar-container">
          <div className="hp-bar">
            <div
              className="hp-bar-fill"
              style={{
                width: `${hpPercentage}%`,
                height: "100%",
                backgroundColor: getHPBarColor(),
              }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
