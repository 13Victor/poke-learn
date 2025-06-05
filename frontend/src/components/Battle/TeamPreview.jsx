// src/components/Battle/TeamPreview.jsx
import React, { useState } from "react";
import "../../styles/Battle/TeamPreview.css"; // Importa tu archivo CSS para estilos

export function TeamPreview({ requestData, teamPreviewPokemon, onSendCommand, isProcessingCommand }) {
  const [selectedLeader, setSelectedLeader] = useState(1); // Default to first Pokémon

  // Get player's team from request data or team preview data
  const playerTeam = requestData?.side?.pokemon || [];
  const opponentPreview = teamPreviewPokemon?.p2 || [];
  const teamName = requestData?.side?.name || "Unnamed Team";

  // Function to get Pokémon sprite URL using the new format
  const getPokemonSprite = (pokemonName) => {
    if (!pokemonName) return null;

    // Format the name for the URL (lowercase, remove spaces and special characters)
    const formattedName = pokemonName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/\s+/g, "");

    return `https://play.pokemonshowdown.com/sprites/home/${formattedName}.png`;
  };

  // Handle Pokémon selection as leader
  const handleSelectLeader = (index) => {
    setSelectedLeader(index + 1); // Convert to 1-based index
  };

  // Handle team confirmation
  const handleConfirmTeam = () => {
    // Create team order with selected leader first, others in original order
    const teamOrder = [selectedLeader];
    for (let i = 1; i <= 6; i++) {
      if (i !== selectedLeader) {
        teamOrder.push(i);
      }
    }

    const teamString = teamOrder.join("");
    const command = `>p1 team ${teamString}`;
    console.log("Enviando orden del equipo:", command);
    onSendCommand(command);
  };

  return (
    <div className="team-preview-container">
      <div className="team-preview-header">
        <h2>🔍 Vista Previa de Equipos</h2>
        <p>Selecciona qué Pokémon quieres que salga primero al campo de batalla.</p>
      </div>

      <div className="teams-preview-grid">
        {/* Player's Team */}
        <div className="team-preview-section player-section team-card">
          <h3>{teamName}</h3>
          <div className="pokemon-grid">
            {playerTeam.map((pokemon, index) => {
              if (!pokemon) return null;

              const pokemonName = pokemon.details?.split(",")[0] || pokemon.species || "Unknown";
              const isSelected = selectedLeader === index + 1;

              return (
                <div
                  key={index}
                  className={`pokemon-preview-card ${isSelected ? "selected-leader" : ""}`}
                  onClick={() => handleSelectLeader(index)}
                  style={{ cursor: isProcessingCommand ? "not-allowed" : "pointer" }}
                >
                  <div className="pokemon-sprite">
                    <img
                      src={getPokemonSprite(pokemonName)}
                      alt={pokemonName}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/96x96?text=?";
                      }}
                    />
                    {pokemon.item && (
                      <img className="item-indicator" src={`/assets/items/${pokemon.item}.webp`} alt="" srcset="" />
                    )}
                  </div>
                  <div className="pokemon-info">
                    <h4>{pokemonName}</h4>
                  </div>

                  {isSelected && <div className="selection-glow"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Opponent's Team */}
        <div className="team-preview-section opponent-section">
          <h3>
            {teamPreviewPokemon?.difficulty
              ? `${teamPreviewPokemon.difficulty.charAt(0).toUpperCase() + teamPreviewPokemon.difficulty.slice(1)} CPU`
              : "Equipo Rival"}
          </h3>

          <div className="pokemon-grid">
            {opponentPreview.map((pokemon, index) => {
              const pokemonName = pokemon.species || pokemon.details?.split(",")[0] || "Unknown";

              return (
                <div key={index} className="pokemon-preview-card opponent-card">
                  <div className="pokemon-sprite">
                    <img
                      src={getPokemonSprite(pokemonName)}
                      alt={pokemonName}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/96x96?text=?";
                      }}
                    />
                  </div>
                  <div className="pokemon-info">
                    <h4>{pokemonName}</h4>
                  </div>
                  {pokemon.hasItem && (
                    <div className="item-indicator" title="Tiene objeto">
                      📦
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="team-preview-controls">
        <div className="leader-display">
          <h4>Pokémon Líder Seleccionado:</h4>
          {playerTeam[selectedLeader - 1] && (
            <div className="selected-leader-info">
              <span className="leader-name">{playerTeam[selectedLeader - 1].details?.split(",")[0] || "Pokémon"}</span>
              <span className="leader-position">#{selectedLeader}</span>
            </div>
          )}
        </div>

        <div className="control-buttons">
          <button onClick={handleConfirmTeam} disabled={isProcessingCommand} className="confirm-button">
            {isProcessingCommand
              ? "Confirmando..."
              : `✅ Confirmar - ${playerTeam[selectedLeader - 1]?.details?.split(",")[0] || "Pokémon"} como Líder`}
          </button>
        </div>

        <div className="team-preview-tips">
          <p>
            💡 <strong>Consejo:</strong> Haz clic en el Pokémon que quieras que salga primero.
          </p>
          <p>🎯 El resto de tu equipo mantendrá su orden original.</p>
          <p>⚡ Elige estratégicamente según el equipo rival que puedes ver.</p>
        </div>
      </div>
    </div>
  );
}
