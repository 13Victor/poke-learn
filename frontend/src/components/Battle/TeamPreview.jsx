// src/components/Battle/TeamPreview.jsx
import React, { useState } from "react";

export function TeamPreview({ requestData, teamPreviewPokemon, onSendCommand, isProcessingCommand }) {
  const [selectedOrder, setSelectedOrder] = useState([1, 2, 3, 4, 5, 6]); // Default order
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Get player's team from request data or team preview data
  const playerTeam = requestData?.side?.pokemon || [];
  const opponentPreview = teamPreviewPokemon?.p2 || [];

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

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle drop
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...selectedOrder];
    const draggedItem = newOrder[draggedIndex];

    // Remove dragged item
    newOrder.splice(draggedIndex, 1);

    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedItem);

    setSelectedOrder(newOrder);
    setDraggedIndex(null);
  };

  // Handle team confirmation
  const handleConfirmTeam = () => {
    const teamString = selectedOrder.join("");
    const command = `>p1 team ${teamString}`;
    console.log("Enviando orden del equipo:", command);
    onSendCommand(command);
  };

  // Reset to default order
  const handleResetOrder = () => {
    setSelectedOrder([1, 2, 3, 4, 5, 6]);
  };

  return (
    <div className="team-preview-container">
      <div className="team-preview-header">
        <h2>🔍 Vista Previa de Equipos</h2>
        <p>Organiza tu equipo arrastrando los Pokémon. El primer Pokémon será el que salga al campo.</p>
      </div>

      <div className="teams-preview-grid">
        {/* Player's Team */}
        <div className="team-preview-section player-section">
          <h3>🎮 Tu Equipo</h3>
          <div className="pokemon-grid">
            {selectedOrder.map((pokemonIndex, displayIndex) => {
              const pokemon = playerTeam[pokemonIndex - 1];
              if (!pokemon) return null;

              const pokemonName = pokemon.details?.split(",")[0] || pokemon.species || "Unknown";
              const isLeader = displayIndex === 0;

              return (
                <div
                  key={`${pokemonIndex}-${displayIndex}`}
                  className={`pokemon-preview-card ${isLeader ? "team-leader" : ""} ${
                    draggedIndex === displayIndex ? "dragging" : ""
                  }`}
                  draggable={!isProcessingCommand}
                  onDragStart={(e) => handleDragStart(e, displayIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, displayIndex)}
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
                  </div>
                  <div className="pokemon-info">
                    <div className="pokemon-name">{pokemonName}</div>
                    <div className="pokemon-position">
                      {isLeader && <span className="leader-badge">👑 Líder</span>}
                      <span className="position-number">#{displayIndex + 1}</span>
                    </div>
                  </div>
                  {pokemon.item && (
                    <div className="item-indicator" title="Tiene objeto">
                      📦
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Opponent's Team */}
        <div className="team-preview-section opponent-section">
          <h3>🤖 Equipo Rival</h3>
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
                    <div className="pokemon-name">{pokemonName}</div>
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
        <div className="order-display">
          <span>Orden actual: {selectedOrder.join(" → ")}</span>
        </div>

        <div className="control-buttons">
          <button onClick={handleResetOrder} disabled={isProcessingCommand} className="reset-button">
            🔄 Restaurar Orden
          </button>

          <button onClick={handleConfirmTeam} disabled={isProcessingCommand} className="confirm-button">
            {isProcessingCommand ? "Confirmando..." : "✅ Confirmar Equipo"}
          </button>
        </div>

        <div className="team-preview-tips">
          <p>
            💡 <strong>Consejo:</strong> Coloca tu Pokémon más fuerte o estratégico en primera posición.
          </p>
          <p>🎯 El orden de tu equipo puede influir en la estrategia de tu oponente.</p>
        </div>
      </div>
    </div>
  );
}
