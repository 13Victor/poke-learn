import React, { memo, useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import TeamContainer from "./TeamContainer";
import TableView from "./TableView";
import LoadingIndicator from "./LoadingIndicator";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import "../../styles/TeamMaker.css";
import SaveTeamButton from "./SaveTeamButton";
import TeamAnalysis from "./TeamAnalysis";
import { HighlightProvider } from "./TeamAnalysis";
import apiService from "../../services/apiService";
import { useTeam } from "../../contexts/TeamContext";
import { calculatePokemonStats } from "../../utils/pokemonStatsCalculator";

const TeamMaker = memo(() => {
  const { isAllDataLoaded, isLoading, pokemons, moves, items, abilities } = usePokemonData();
  const { teamId } = useParams();
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [error, setError] = useState(null);
  const [teamName, setTeamName] = useState("");
  const { setPokemon, setMove, setItem, setAbility, updatePokemonStats, resetTeam } = useTeam();
  const navigate = useNavigate();
  const location = useLocation();

  const teamLoadedRef = useRef(false);
  const resetPerformedRef = useRef(false);

  console.log("🔴 TeamMaker component rendered, teamId:", teamId);

  // Efecto para resetear el estado cuando se navega a /teammaker (sin ID)
  useEffect(() => {
    if (!teamId && !resetPerformedRef.current) {
      console.log("🔄 Resetting team state for new team creation");
      resetTeam();
      resetPerformedRef.current = true;
      teamLoadedRef.current = false;
    }

    if (teamId) {
      resetPerformedRef.current = false;
    }
  }, [teamId, resetTeam, location.pathname]);

  // Manejar errores y redireccionar si es necesario
  useEffect(() => {
    if (error && error.includes("no encontrado")) {
      const timer = setTimeout(() => {
        navigate("/teams");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  // Cargar equipo si estamos en modo edición - SOLO UNA VEZ
  useEffect(() => {
    if (teamId && isAllDataLoaded && !loadingTeam && !teamLoadedRef.current) {
      const loadTeam = async () => {
        try {
          setLoadingTeam(true);
          setError(null);

          console.log(`🔄 Loading team with ID: ${teamId}`);
          const response = await apiService.getTeamById(teamId);

          if (!response.success) {
            throw new Error(response.message || "Error al cargar el equipo");
          }

          const teamData = response.data.team;
          console.log("📥 Team data loaded:", teamData);

          teamLoadedRef.current = true;
          setTeamName(teamData.name || "");

          if (!teamData.pokemon || !teamData.pokemon.length) {
            console.warn("⚠️ Team has no Pokémon");
            setLoadingTeam(false);
            return;
          }

          console.log("Team Pokémon:", teamData.pokemon);

          // Cargar cada Pokémon en el TeamContext
          teamData.pokemon.forEach((pokemonData) => {
            console.log("Loading Pokémon data:", pokemonData);
            try {
              const slotIndex = pokemonData.slot - 1;

              const pokemonObj = pokemons.find(
                (p) =>
                  p.id === pokemonData.pokemon_id || p.name.toLowerCase() === pokemonData.pokemon_name.toLowerCase()
              );

              if (pokemonObj) {
                setPokemon(slotIndex, pokemonObj);

                console.log(
                  `Pokémon ${pokemonData.pokemon_name} ability: ${pokemonData.build?.ability_id}, item: ${pokemonData.build?.item_id}`
                );

                // Cargar la habilidad
                if (pokemonData.build && pokemonData.build.ability_id) {
                  const abilityId = pokemonData.build.ability_id;
                  console.log(`Setting ability from DB: ${abilityId} for ${pokemonData.pokemon_name}`);

                  const abilityName = getDisplayNameForAbility(abilityId);
                  setAbility(slotIndex, abilityName, abilityId);
                }

                // Cargar el item
                if (pokemonData.build && pokemonData.build.item_id) {
                  const itemId = pokemonData.build.item_id;
                  console.log(`Setting item from DB: ${itemId} for ${pokemonData.pokemon_name}`);

                  const itemName = getDisplayNameForItem(itemId);
                  setItem(slotIndex, itemName, itemId);
                }

                // Cargar movimientos
                if (pokemonData.moves && pokemonData.moves.length) {
                  pokemonData.moves.forEach((moveId, moveIndex) => {
                    if (moveId) {
                      const moveData = moves[moveId];

                      if (moveData) {
                        const moveObject = {
                          name: moveData.name,
                          type: moveData.type,
                          id: moveId,
                        };
                        setMove(slotIndex, moveIndex, moveObject);
                      } else {
                        setMove(slotIndex, moveIndex, moveId);
                      }
                    }
                  });
                }

                // Cargar EVs, IVs y naturaleza usando la utilidad centralizada
                const evs = pokemonData.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
                const ivs = pokemonData.ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
                const nature = pokemonData.nature || "Hardy";

                // Calcular stats usando la utilidad centralizada
                const calculatedStats = calculatePokemonStats(pokemonObj.baseStats, {
                  evs,
                  ivs,
                  nature,
                  level: pokemonData.level || 100,
                });

                console.log(`Calculated stats for ${pokemonData.pokemon_name}:`, calculatedStats);
                console.log(`Setting stats for ${pokemonData.pokemon_name}:`, {
                  stats: calculatedStats,
                  evs,
                  ivs,
                  nature,
                });

                // Actualizar stats completos
                updatePokemonStats(slotIndex, calculatedStats, evs, ivs, nature);
              } else {
                console.warn(`⚠️ Pokémon with id/name ${pokemonData.pokemon_id || pokemonData.pokemon_name} not found`);
              }
            } catch (err) {
              console.error(`❌ Error loading Pokémon in slot ${pokemonData.slot}:`, err);
            }
          });

          console.log("✅ Team loaded successfully");
        } catch (err) {
          console.error("❌ Error loading team:", err);
          setError(err.message);
        } finally {
          setLoadingTeam(false);
        }
      };

      loadTeam();
    }
  }, [
    teamId,
    isAllDataLoaded,
    setPokemon,
    setMove,
    setItem,
    setAbility,
    updatePokemonStats,
    pokemons,
    loadingTeam,
    items,
    abilities,
    moves,
  ]);

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

  return (
    <div className="teammaker-page">
      <div className="teammaker-header">
        <h1>{teamId ? "Edit Team" : "Team Maker"}</h1>
        <p>{teamId ? "Update your team" : "Build your perfect team!"}</p>
        <SaveTeamButton teamId={teamId} initialTeamName={teamName} />
      </div>
      <HighlightProvider>
        <div className="teammaker-container">
          <TeamContainer />

          <div className="table-section">
            {(isLoading || loadingTeam) && !isAllDataLoaded ? (
              <LoadingIndicator label={loadingTeam ? "team" : "data"} />
            ) : (
              <TableView />
            )}
            {error && (
              <div className="error-message">
                <p>Error: {error}</p>
                {error.includes("no encontrado") && <p>Redirigiendo a la página de equipos en 3 segundos...</p>}
              </div>
            )}
          </div>

          <TeamAnalysis />
        </div>
      </HighlightProvider>
    </div>
  );
});

export default TeamMaker;
