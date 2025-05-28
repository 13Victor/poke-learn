// components/teams/TeamAdditionalInfo.jsx
import { FaChevronLeft, FaChevronRight, FaExclamationCircle, FaExclamationTriangle } from "react-icons/fa";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import { calculatePokemonStats } from "../../utils/pokemonStatsCalculator";
import { useEffect, useState } from "react";
import MoveButton from "../TeamMaker/MoveButton";
import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

// Registrar los componentes necesarios de Chart.js
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const TeamAdditionalInfo = ({ teams, selectedTeamId, onSelectTeam }) => {
  const { pokemons, abilities, items, moves, isAllDataLoaded } = usePokemonData();
  const [enhancedTeams, setEnhancedTeams] = useState([]);
  const [labels, setLabels] = useState({});
  const [hoveredRadarId, setHoveredRadarId] = useState(null); // ID del radar actualmente hovereado

  // Función para validar si un Pokémon está completo (igual que en TeamCard)
  const isPokemonComplete = (pokemon) => {
    const hasAllMoves =
      pokemon.moves && pokemon.moves.length === 4 && pokemon.moves.every((move) => move && move.trim() !== "");
    const hasAbility = pokemon.ability_id && pokemon.ability_id.trim() !== "";
    const hasItem = pokemon.item_id && pokemon.item_id.trim() !== "";
    const evs = pokemon.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    const totalEvs = Object.values(evs).reduce((sum, ev) => sum + (ev || 0), 0);
    const hasAllEvs = totalEvs === 508;

    return { hasAllMoves, hasAbility, hasItem, hasAllEvs };
  };

  // Función para obtener el estado de un Pokémon individual
  const getPokemonStatus = (pokemon) => {
    const { hasAllMoves, hasAbility, hasItem, hasAllEvs } = isPokemonComplete(pokemon);

    if (!hasAllMoves || !hasAbility || !hasItem) {
      return "missing-requirements";
    }

    if (!hasAllEvs) {
      return "missing-evs";
    }

    return "complete";
  };

  const handleRadarMouseEnter = (pokemon, radarId) => {
    // Cambiar los labels a los valores de las estadísticas del Pokémon hovereado
    setHoveredRadarId(radarId);
    setLabels((prevLabels) => ({
      ...prevLabels,
      [radarId]: [
        pokemon.calculatedStats.hp,
        pokemon.calculatedStats.atk,
        pokemon.calculatedStats.def,
        pokemon.calculatedStats.spe,
        pokemon.calculatedStats.spa,
        pokemon.calculatedStats.spd,
      ],
    }));
  };

  const handleRadarMouseLeave = (radarId) => {
    // Restaurar los labels originales
    setHoveredRadarId(null);
    setLabels((prevLabels) => ({
      ...prevLabels,
      [radarId]: ["HP", "Atk", "Def", "Spe", "SpA", "SpD"],
    }));
  };

  // Función auxiliar para obtener el nombre de visualización de una habilidad a partir de su ID
  const getDisplayNameForAbility = (abilityId) => {
    let displayName = abilityId;

    try {
      for (const pokemonId in abilities) {
        const pokemonAbilities = abilities[pokemonId];

        if (pokemonAbilities?.abilities) {
          for (const type in pokemonAbilities.abilities) {
            const ability = pokemonAbilities.abilities[type];

            if (Array.isArray(ability) && ability.length >= 3) {
              const name = ability[0];
              const id = ability[2];

              if (id === abilityId) {
                console.log(`Found ability display name: ${name} for ID: ${abilityId}`);
                displayName = name;
                return displayName;
              }
            }
          }
        }
      }

      console.log(`Using original ID as display name for ability: ${abilityId}`);
      return displayName;
    } catch (err) {
      console.error(`Error getting display name for ability: ${abilityId}`, err);
      return displayName;
    }
  };

  // Función auxiliar para obtener el nombre de visualización de un item a partir de su ID
  const getDisplayNameForItem = (itemId) => {
    let displayName = itemId;

    try {
      if (items && items[itemId] && items[itemId].name) {
        displayName = items[itemId].name;
        console.log(`Found item display name: ${displayName} for ID: ${itemId}`);
        return displayName;
      }

      console.log(`Using original ID as display name for item: ${itemId}`);
      return displayName;
    } catch (err) {
      console.error(`Error getting display name for item: ${itemId}`, err);
      return displayName;
    }
  };

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

          // Obtener nombres de habilidades, items y movimientos usando las funciones auxiliares
          const abilityName = getDisplayNameForAbility(pokemon.ability_id);
          const itemName = getDisplayNameForItem(pokemon.item_id);

          // Para los movimientos, obtener tanto el nombre como el tipo
          const moveData =
            pokemon.moves
              ?.map((moveId) => {
                const move = moves[moveId];
                return move
                  ? {
                      name: move.name || moveId,
                      type: move.type || null,
                    }
                  : null;
              })
              .filter(Boolean) || [];

          return {
            ...pokemon,
            pokemonData,
            calculatedStats,
            abilityName,
            itemName,
            moveData,
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

  // Función para formatear el nombre (capitalizar primera letra de cada palabra)
  const formatName = (name) => {
    if (!name) return "No Ability";
    return name
      .split(/[\s-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const calculateRadarScale = (stats) => {
    if (!stats) return 500;

    // Obtener todas las estadísticas del Pokémon
    const allStats = [stats.hp, stats.atk, stats.def, stats.spa, stats.spd, stats.spe];

    // Encontrar la estadística más alta
    const maxStat = Math.max(...allStats);

    // Si la estadística máxima es menor o igual a 500, usar 500 como máximo
    if (maxStat <= 500) {
      return 500;
    }

    // Si supera 500, redondear hacia arriba al siguiente múltiplo de 100
    return Math.ceil(maxStat / 100) * 100;
  };

  function convertToRGBA(color, opacity) {
    if (color.startsWith("rgb")) {
      // Si el color ya está en formato rgb, añade la opacidad
      return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
    } else if (color.startsWith("#")) {
      // Convertir de hex a rgba
      const bigint = parseInt(color.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color; // Devuelve el color original si no es rgb o hex
  }

  return (
    <div className="team-additional-info-container">
      <div className="team-navigation-header">
        <h3>{selectedTeam.name}</h3>
        {teams.length > 1 && (
          <div className="team-navigation">
            <button className="nav-arrow" onClick={handlePrevTeam} aria-label="Previous team">
              <FaChevronLeft />
            </button>
            <button className="nav-arrow" onClick={handleNextTeam} aria-label="Next team">
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      <div className="pokemon-details-list">
        {Array.isArray(selectedTeam.pokemon) && selectedTeam.pokemon.length > 0 ? (
          selectedTeam.pokemon
            .sort((a, b) => (a.slot || 0) - (b.slot || 0))
            .map((pokemon, index) => {
              const radarId = `radar-${index}`; // ID único para cada radar
              const pokemonStatus = getPokemonStatus(pokemon); // Obtener el estado del Pokémon

              return (
                <div key={pokemon.id || index} className="pokemon-detail-item">
                  {/* Iconos de estado del Pokémon */}
                  {pokemonStatus === "missing-evs" && (
                    <Tippy content="Missing EVs" placement="top" theme="warning">
                      <div className="pokemon-warning-icon team-warning-icon">
                        <FaExclamationTriangle />
                      </div>
                    </Tippy>
                  )}
                  {pokemonStatus === "missing-requirements" && (
                    <Tippy
                      content="Incomplete Pokémon (missing moves, ability, or item)"
                      placement="top"
                      theme="danger"
                    >
                      <div className="pokemon-error-icon team-error-icon">
                        <FaExclamationCircle />
                      </div>
                    </Tippy>
                  )}

                  <div
                    className="image-container"
                    style={{
                      background:
                        pokemon.types.length > 1
                          ? `linear-gradient(to right, var(--type-${pokemon.types[0].toLowerCase()}), var(--type-${pokemon.types[1].toLowerCase()}))`
                          : `var(--type-${pokemon.types[0].toLowerCase()})`,
                      opacity: 0.75,
                    }}
                  ></div>
                  <h5>{pokemon.pokemon_name || "Unknown Pokémon"}</h5>
                  <div className="pokemon-sprite-title">
                    <img
                      className="pokemon-detail-sprite"
                      src={`/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`}
                      alt={pokemon.pokemon_name || "Unknown"}
                      onError={(e) => {
                        e.target.src = "/assets/pokemon-small-hd-sprites-webp/0000.webp";
                      }}
                    />
                  </div>

                  <div className="pokemon-types">
                    {pokemon.types.map((type, idx) => (
                      <img key={idx} className="type-icon" src={`/assets/type-icons/${type}.png`} alt={type} />
                    ))}
                  </div>

                  <div className="container-top">
                    <span className="pokemonCurrentLevel">
                      <strong>Lv.</strong>
                      <p> {pokemon.level || 100}</p>
                    </span>
                    <span className="pokemon-nature">{pokemon.nature || "Hardy"}</span>
                  </div>

                  <div className="poke-card-info-grid">
                    <div
                      className="pokemon-header-info"
                      style={{
                        background:
                          pokemon.types.length > 1
                            ? `linear-gradient(to right, rgba(var(--type-${pokemon.types[0].toLowerCase()}-rgb), 0.4), rgba(var(--type-${pokemon.types[1].toLowerCase()}-rgb), 0.4))`
                            : `rgba(var(--type-${pokemon.types[0].toLowerCase()}-rgb), 0.4)`,
                      }}
                    >
                      <span className="info-value">
                        {pokemon.item_id ? (
                          <>
                            <img
                              className="item-icon"
                              src={`/assets/items/${pokemon.item_id}.webp`}
                              alt={pokemon.itemName}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            {formatName(pokemon.itemName)}
                          </>
                        ) : (
                          "No item"
                        )}
                      </span>
                      <span className="info-value">{formatName(pokemon.abilityName)}</span>
                    </div>
                    <div className="moves-section">
                      <div className="moveInputsContainer">
                        {/* Always show 4 move slots, with placeholders for empty ones */}
                        {Array.from({ length: 4 }, (_, moveIndex) => {
                          const move = pokemon.moveData?.[moveIndex] || null;
                          return (
                            <MoveButton
                              key={moveIndex}
                              move={move}
                              index={moveIndex}
                              isSelected={false}
                              pokemonHasName={!!pokemon.pokemon_name}
                              isMovesMode={false}
                              onClick={() => {}}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div
                      className="stats-chart-container"
                      id={radarId}
                      onMouseEnter={() => handleRadarMouseEnter(pokemon, radarId)}
                      onMouseLeave={() => handleRadarMouseLeave(radarId)}
                    >
                      {pokemon.calculatedStats && (
                        <Radar
                          className="stats-chart"
                          data={{
                            labels: labels[radarId] || ["HP", "Atk", "Def", "Spe", "SpA", "SpD"], // Usa etiquetas específicas para este radar
                            datasets: [
                              {
                                label: pokemon.pokemon_name,
                                data: [
                                  pokemon.calculatedStats.hp,
                                  pokemon.calculatedStats.atk,
                                  pokemon.calculatedStats.def,
                                  pokemon.calculatedStats.spe,
                                  pokemon.calculatedStats.spa,
                                  pokemon.calculatedStats.spd,
                                ],
                                backgroundColor: function (context) {
                                  const chart = context.chart;
                                  const { ctx, chartArea } = chart;

                                  if (!chartArea) {
                                    return "rgba(168, 168, 168, 0.3)";
                                  }

                                  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                                  if (pokemon.types.length > 1) {
                                    gradient.addColorStop(
                                      0,
                                      convertToRGBA(
                                        getComputedStyle(document.documentElement)
                                          .getPropertyValue(`--type-${pokemon.types[0].toLowerCase()}`)
                                          .trim(),
                                        0.4
                                      )
                                    );
                                    gradient.addColorStop(
                                      1,
                                      convertToRGBA(
                                        getComputedStyle(document.documentElement)
                                          .getPropertyValue(`--type-${pokemon.types[1].toLowerCase()}`)
                                          .trim(),
                                        0.4
                                      )
                                    );
                                  } else {
                                    const color = getComputedStyle(document.documentElement)
                                      .getPropertyValue(`--type-${pokemon.types[0].toLowerCase()}`)
                                      .trim();
                                    gradient.addColorStop(0, convertToRGBA(color, 0.4));
                                    gradient.addColorStop(1, convertToRGBA(color, 0.4));
                                  }
                                  return gradient;
                                },
                                borderWidth: 0,
                                fill: true,
                                pointRadius: 0, // Elimina las "bolitas"
                                pointHoverRadius: 0, // Elimina las "bolitas" al hacer hover
                                pointHitRadius: 0,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                              intersect: true,
                              mode: "nearest",
                            },
                            scales: {
                              r: {
                                angleLines: {
                                  color: "rgba(220, 220, 220, 0.8)",
                                },
                                grid: {
                                  color: "rgba(220, 220, 220, 0.5)",
                                },
                                suggestedMin: 0,
                                suggestedMax: calculateRadarScale(pokemon.calculatedStats),
                                ticks: {
                                  stepSize: 100,
                                  display: false,
                                },
                                pointLabels: {
                                  color: "rgb(0, 0, 0)",
                                  font: {
                                    size: 10,
                                    weight: "500",
                                    family: "system-ui",
                                  },
                                },
                              },
                            },
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                enabled: false,
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <p className="no-pokemon-message">This team has no Pokémon yet</p>
        )}
      </div>
    </div>
  );
};

export default TeamAdditionalInfo;
