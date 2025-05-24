// components/teams/TeamAdditionalInfo.jsx
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const TeamAdditionalInfo = ({ teams, selectedTeamId, onSelectTeam }) => {
  // Si no hay equipos, no mostrar nada
  if (!teams || teams.length === 0) {
    return null;
  }

  // Encontrar el índice del equipo seleccionado
  const selectedTeamIndex = teams.findIndex((team) => team.id === selectedTeamId);
  const selectedTeam = selectedTeamIndex !== -1 ? teams[selectedTeamIndex] : teams[0];

  const handlePrevTeam = () => {
    const prevIndex = (selectedTeamIndex - 1 + teams.length) % teams.length;
    onSelectTeam(teams[prevIndex]);
  };

  const handleNextTeam = () => {
    const nextIndex = (selectedTeamIndex + 1) % teams.length;
    onSelectTeam(teams[nextIndex]);
  };

  // Si no hay equipo seleccionado, mostrar mensaje
  if (!selectedTeam) {
    return (
      <div className="team-additional-info-container">
        <p className="no-team-selected">Select a team to view details</p>
      </div>
    );
  }

  console.log("Selected Team:", selectedTeam);

  return (
    <div className="team-additional-info-container">
      <div className="team-navigation-header">
        <h3>{selectedTeam.name}</h3>

        {/* Navegación con flechas si hay más de un equipo */}
        {teams.length > 1 && (
          <div className="team-navigation">
            <button className="nav-arrow" onClick={handlePrevTeam} aria-label="Previous team">
              <FaChevronLeft />
            </button>
            <span className="team-counter">
              {selectedTeamIndex + 1} / {teams.length}
            </span>
            <button className="nav-arrow" onClick={handleNextTeam} aria-label="Next team">
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Lista de Pokémon con información detallada */}
      <div className="pokemon-details-list">
        {Array.isArray(selectedTeam.pokemon) && selectedTeam.pokemon.length > 0 ? (
          selectedTeam.pokemon
            .sort((a, b) => (a.slot || 0) - (b.slot || 0))
            .map((pokemon, index) => (
              <div key={pokemon.id || index} className="pokemon-detail-item">
                <div className="pokemon-image-container">
                  <img
                    className="pokemon-detail-sprite"
                    src={`/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`}
                    alt={pokemon.name || "Unknown"}
                    onError={(e) => {
                      e.target.src = "/assets/pokemon-small-hd-sprites-webp/0000.webp";
                    }}
                  />
                </div>
                <div className="pokemon-full-info">
                  <div className="pokemon-header">
                    <h4>{pokemon.name || "Unknown Pokémon"}</h4>
                    <span className="pokemon-nature">{pokemon.nature || "Hardy"}</span>
                  </div>

                  <div className="pokemon-details">
                    {/* Item */}
                    <div className="detail-row">
                      <span className="detail-label">Item:</span>
                      <span className="detail-value">
                        {pokemon.item_id ? (
                          <>
                            <img
                              className="detail-item-sprite"
                              src={`/assets/items/${pokemon.item_id}.webp`}
                              alt={pokemon.item_id}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            {pokemon.item_id}
                          </>
                        ) : (
                          "None"
                        )}
                      </span>
                    </div>

                    {/* Ability */}
                    <div className="detail-row">
                      <span className="detail-label">Ability:</span>
                      <span className="detail-value">{pokemon.ability_id || "None"}</span>
                    </div>

                    {/* Moves */}
                    <div className="detail-row moves-row">
                      <span className="detail-label">Moves:</span>
                      <div className="moves-list">
                        {pokemon.moves && pokemon.moves.length > 0 ? (
                          pokemon.moves.map((move, moveIndex) => (
                            <span key={moveIndex} className="move-item">
                              {move || "-"}
                            </span>
                          ))
                        ) : (
                          <span className="no-moves">No moves</span>
                        )}
                      </div>
                    </div>

                    {/* EVs if available */}
                    {pokemon.evs && (
                      <div className="detail-row evs-row">
                        <span className="detail-label">EVs:</span>
                        <div className="evs-list">
                          {Object.entries(pokemon.evs).map(
                            ([stat, value]) =>
                              value > 0 && (
                                <span key={stat} className="ev-item">
                                  {stat.toUpperCase()}: {value}
                                </span>
                              )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
        ) : (
          <p className="no-pokemon-message">This team has no Pokémon yet</p>
        )}
      </div>
    </div>
  );
};

export default TeamAdditionalInfo;
