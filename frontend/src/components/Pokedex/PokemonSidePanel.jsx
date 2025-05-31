import React, { useState, useEffect } from "react";
import { formatPokemonId, generatePokemonImagePath } from "../../utils/pokemonUtils";
import { handleImageError, formatPokemonTypesIcon } from "../../utils/imageUtils";
import apiService from "../../services/apiService";

// Función para formatear el ratio de género
const formatGenderRatio = (pokemon) => {
  // Caso 1: Si tiene genderRatio con M y F (porcentajes exactos)
  if (pokemon.genderRatio && typeof pokemon.genderRatio === "object") {
    const malePercent = Math.round((pokemon.genderRatio.M || 0) * 100);
    const femalePercent = Math.round((pokemon.genderRatio.F || 0) * 100);

    return {
      male: malePercent,
      female: femalePercent,
      genderless: false,
    };
  }

  // Caso 2: Si tiene gender como string
  if (pokemon.gender) {
    if (pokemon.gender === "M") {
      return { male: 100, female: 0, genderless: false };
    }
    if (pokemon.gender === "F") {
      return { male: 0, female: 100, genderless: false };
    }
    if (pokemon.gender === "N") {
      return { male: 0, female: 0, genderless: true };
    }
  }

  // Caso 3: No tiene información de género = 50/50
  return { male: 50, female: 50, genderless: false };
};

const PokemonSidePanel = ({ pokemon, isOpen, onClose }) => {
  const [pokedexEntry, setPokedexEntry] = useState("Loading description...");
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);

  // ✅ HOOKS SIEMPRE PRIMERO - antes de cualquier return early

  // Cargar descripción de la Pokédex cuando cambie el Pokémon
  useEffect(() => {
    if (pokemon && pokemon.num) {
      setIsLoadingEntry(true);
      setPokedexEntry("Loading description...");

      apiService
        .getPokedexEntry(pokemon.num)
        .then((entry) => {
          setPokedexEntry(entry);
          setIsLoadingEntry(false);
        })
        .catch((error) => {
          console.error("Error loading Pokédex description:", error);
          setPokedexEntry("Could not load description");
          setIsLoadingEntry(false);
        });
    }
  }, [pokemon]);

  // ✅ AHORA sí podemos hacer return early después de todos los hooks
  if (!pokemon) return null;

  const pokemonId = formatPokemonId(pokemon.num);
  const pokemonImagePath = generatePokemonImagePath(pokemon);
  const genderInfo = formatGenderRatio(pokemon); // Ahora pasamos todo el pokemon

  return (
    <div className={`side-panel ${isOpen ? "open" : ""}`}>
      <div className="side-panel-header">
        <button className="close-btn" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="side-panel-content">
        <div className="pokemon-header">
          <div
            className="pokemon-image-large"
            style={{
              background:
                pokemon.types.length > 1
                  ? `linear-gradient(to right, rgba(var(--type-${pokemon.types[0].toLowerCase()}-rgb), 0.5), rgba(var(--type-${pokemon.types[1].toLowerCase()}-rgb), 0.5))`
                  : `rgba(var(--type-${pokemon.types[0].toLowerCase()}-rgb), 0.5)`,
            }}
          >
            <div className="blank">
              <img
                src={pokemonImagePath}
                alt={pokemon.name}
                className="large-image"
                onError={(e) => handleImageError(e, pokemon)}
              />

              <p
                style={{
                  background:
                    pokemon.types.length > 1
                      ? `linear-gradient(to right, rgba(var(--type-${pokemon.types[0].toLowerCase()}-rgb), 0.5), rgba(var(--type-${pokemon.types[1].toLowerCase()}-rgb), 0.5))`
                      : `rgba(var(--type-${pokemon.types[0].toLowerCase()}-rgb), 0.5)`,
                  color: "rgba(0,0,0,.6)",
                }}
              >
                #{pokemon.num}
              </p>
              <span className="pokemon-id">#{pokemonId}</span>
              <div className="pokemon-types">{formatPokemonTypesIcon(pokemon.types)}</div>
            </div>
          </div>
          <div className="pokemon-title">
            <h1 className="pokemon-name-large">{pokemon.name}</h1>
          </div>
        </div>

        <div className="pokemon-details">
          {/* Descripción de la Pokédex */}
          <div className="detail-section">
            <h3>Description</h3>
            <div className="pokedex-description">
              {isLoadingEntry ? (
                <div className="loading-description">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>Loading description...</p>
                </div>
              ) : (
                <p>{pokedexEntry}</p>
              )}
            </div>
          </div>

          {/* Información Básica */}
          <div className="detail-section">
            <h3>Basic Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Height</span>
                <span className="detail-value">{pokemon.height} m</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Weight</span>
                <span className="detail-value">{pokemon.weight} kg</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gender Ratio</span>
                <div className="gender-ratio">
                  {genderInfo.genderless ? (
                    <span className="genderless">Genderless</span>
                  ) : (
                    <div className="gender-breakdown">
                      <div className="gender-item">
                        <span className="gender-icon male">♂</span>
                        <span className="gender-percent">
                          {genderInfo.male % 1 === 0 ? genderInfo.male : genderInfo.male.toFixed(1)}%
                        </span>
                      </div>
                      <div className="gender-item">
                        <span className="gender-icon female">♀</span>
                        <span className="gender-percent">
                          {genderInfo.female % 1 === 0 ? genderInfo.female : genderInfo.female.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Habilidades */}
          {pokemon.abilities && (
            <div className="detail-section">
              <h3>Abilities</h3>
              <div className="abilities-list">
                {pokemon.abilities.map((ability, index) => (
                  <span key={index} className="ability-tag">
                    {ability}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Estadísticas Base */}
          {pokemon.baseStats && (
            <div className="detail-section">
              <h3>Base Stats</h3>
              <div className="stats-container">
                {Object.entries(pokemon.baseStats).map(([statName, value]) => (
                  <div key={statName} className="stat-row">
                    <span className="stat-name">
                      {statName === "hp"
                        ? "HP"
                        : statName === "atk"
                        ? "Attack"
                        : statName === "def"
                        ? "Defense"
                        : statName === "spa"
                        ? "Sp. Atk"
                        : statName === "spd"
                        ? "Sp. Def"
                        : statName === "spe"
                        ? "Speed"
                        : statName}
                    </span>
                    <div className="stat-bar">
                      <div
                        className="stat-fill"
                        style={{
                          width: `${(value / 255) * 100}%`,
                          backgroundColor: value > 100 ? "#4CAF50" : value > 70 ? "#FF9800" : "#F44336",
                        }}
                      ></div>
                    </div>
                    <span className="stat-value">{value}</span>
                  </div>
                ))}
                {/* Total de estadísticas */}
                <div className="stat-row total-stats">
                  <span className="stat-name total">Total</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill total"
                      style={{
                        width: `${(Object.values(pokemon.baseStats).reduce((a, b) => a + b, 0) / 720) * 100}%`,
                        backgroundColor: "#6c5ce7",
                      }}
                    ></div>
                  </div>
                  <span className="stat-value total">
                    {Object.values(pokemon.baseStats).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PokemonSidePanel;
