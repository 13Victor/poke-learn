// components/teams/TeamAdditionalInfo.jsx
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import { calculatePokemonStats } from "../../utils/pokemonStatsCalculator";
import { useEffect, useState } from "react";

const TeamAdditionalInfo = ({ teams, selectedTeamId, onSelectTeam }) => {
  const { pokemons, abilities, items, moves, isAllDataLoaded } = usePokemonData();
  const [enhancedTeams, setEnhancedTeams] = useState([]);

  // Si no hay equipos, no mostrar nada
  if (!teams || teams.length === 0) {
    return null;
  }

  // Encontrar el índice del equipo seleccionado
  const selectedTeamIndex = teams.findIndex((team) => team.id === selectedTeamId);
  const selectedTeam = selectedTeamIndex !== -1 ? enhancedTeams[selectedTeamIndex] : enhancedTeams[0];

  // Mejorar los datos del equipo con información del contexto
  useEffect(() => {
    if (!isAllDataLoaded) return;

    const enhanced = teams.map((team) => ({
      ...team,
      pokemon:
        team.pokemon?.map((pokemon) => {
          // Encontrar el Pokémon en los datos cargados
          const pokemonData = pokemons.find(
            (p) => p.name.toLowerCase() === pokemon.pokemon_name?.toLowerCase() || p.id === pokemon.pokemon_id
          );

          // Calcular stats si tenemos los datos base
          let calculatedStats = null;
          if (pokemonData?.baseStats) {
            calculatedStats = calculatePokemonStats(pokemonData.baseStats, {
              evs: pokemon.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
              ivs: pokemon.ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
              nature: pokemon.nature || "Hardy",
              level: pokemon.level || 100,
            });
          }

          // Obtener nombres de habilidades, items y movimientos
          const abilityName = abilities[pokemon.ability_id]?.name || pokemon.ability_id;
          const itemName = items[pokemon.item_id]?.name || pokemon.item_id;
          const moveNames = pokemon.moves?.map((moveId) => moves[moveId]?.name || moveId) || [];

          return {
            ...pokemon,
            pokemonData,
            calculatedStats,
            abilityName,
            itemName,
            moveNames,
            types: pokemonData?.types || [],
          };
        }) || [],
    }));

    setEnhancedTeams(enhanced);
  }, [teams, pokemons, abilities, items, moves, isAllDataLoaded]);

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

  // Función para formatear EVs/IVs
  const formatStatSpread = (stats) => {
    if (!stats) return "0/0/0/0/0/0";
    return `${stats.hp}/${stats.atk}/${stats.def}/${stats.spa}/${stats.spd}/${stats.spe}`;
  };

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
                    alt={pokemon.pokemon_name || "Unknown"}
                    onError={(e) => {
                      e.target.src = "/assets/pokemon-small-hd-sprites-webp/0000.webp";
                    }}
                  />
                  {/* Mostrar tipos */}
                  <div className="pokemon-types">
                    {pokemon.types.map((type, idx) => (
                      <span key={idx} className={`type-badge type-${type.toLowerCase()}`}>
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pokemon-full-info">
                  <div className="pokemon-header">
                    <h4>{pokemon.pokemon_name || "Unknown Pokémon"}</h4>
                    <span className="pokemon-level">Lv. {pokemon.level || 100}</span>
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
                              alt={pokemon.itemName}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            {pokemon.itemName}
                          </>
                        ) : (
                          "None"
                        )}
                      </span>
                    </div>

                    {/* Ability */}
                    <div className="detail-row">
                      <span className="detail-label">Ability:</span>
                      <span className="detail-value">{pokemon.abilityName || "None"}</span>
                    </div>

                    {/* Moves */}
                    <div className="detail-row moves-row">
                      <span className="detail-label">Moves:</span>
                      <div className="moves-list">
                        {pokemon.moveNames && pokemon.moveNames.length > 0 ? (
                          pokemon.moveNames.map((move, moveIndex) => (
                            <span key={moveIndex} className="move-item">
                              {move || "-"}
                            </span>
                          ))
                        ) : (
                          <span className="no-moves">No moves</span>
                        )}
                      </div>
                    </div>

                    {/* EVs */}
                    <div className="detail-row">
                      <span className="detail-label">EVs:</span>
                      <span className="detail-value stat-spread">{formatStatSpread(pokemon.evs)}</span>
                    </div>

                    {/* IVs */}
                    <div className="detail-row">
                      <span className="detail-label">IVs:</span>
                      <span className="detail-value stat-spread">{formatStatSpread(pokemon.ivs)}</span>
                    </div>

                    {/* Stats calculadas */}
                    {pokemon.calculatedStats && (
                      <div className="detail-row stats-row">
                        <span className="detail-label">Stats:</span>
                        <div className="stats-grid">
                          <span className="stat-item">HP: {pokemon.calculatedStats.hp}</span>
                          <span className="stat-item">Atk: {pokemon.calculatedStats.atk}</span>
                          <span className="stat-item">Def: {pokemon.calculatedStats.def}</span>
                          <span className="stat-item">SpA: {pokemon.calculatedStats.spa}</span>
                          <span className="stat-item">SpD: {pokemon.calculatedStats.spd}</span>
                          <span className="stat-item">Spe: {pokemon.calculatedStats.spe}</span>
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
