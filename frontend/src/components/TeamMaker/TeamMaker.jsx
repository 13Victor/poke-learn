import React, { memo, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

// Función auxiliar para calcular las stats de un Pokémon
const calculatePokemonStats = (baseStats, evs, ivs, nature, level = 100) => {
  if (!baseStats) return null;

  // Constantes para los modificadores de naturaleza
  const natureModifiers = {
    Adamant: { increased: "atk", decreased: "spa" },
    Bashful: { increased: null, decreased: null },
    Bold: { increased: "def", decreased: "atk" },
    Brave: { increased: "atk", decreased: "spe" },
    Calm: { increased: "spd", decreased: "atk" },
    Careful: { increased: "spd", decreased: "spa" },
    Docile: { increased: null, decreased: null },
    Gentle: { increased: "spd", decreased: "def" },
    Hardy: { increased: null, decreased: null },
    Hasty: { increased: "spe", decreased: "def" },
    Impish: { increased: "def", decreased: "spa" },
    Jolly: { increased: "spe", decreased: "spa" },
    Lax: { increased: "def", decreased: "spd" },
    Lonely: { increased: "atk", decreased: "def" },
    Mild: { increased: "spa", decreased: "def" },
    Modest: { increased: "spa", decreased: "atk" },
    Naive: { increased: "spe", decreased: "spd" },
    Naughty: { increased: "atk", decreased: "spd" },
    Quiet: { increased: "spa", decreased: "spe" },
    Quirky: { increased: null, decreased: null },
    Rash: { increased: "spa", decreased: "spd" },
    Relaxed: { increased: "def", decreased: "spe" },
    Sassy: { increased: "spd", decreased: "spe" },
    Serious: { increased: null, decreased: null },
    Timid: { increased: "spe", decreased: "atk" },
  };

  // Obtener modificadores de naturaleza
  const natureInfo = natureModifiers[nature] || { increased: null, decreased: null };

  // Función para aplicar modificador de naturaleza
  const applyNatureMod = (stat, value) => {
    if (natureInfo.increased === stat) return Math.floor(value * 1.1);
    if (natureInfo.decreased === stat) return Math.floor(value * 0.9);
    return value;
  };

  // Asegurar que EVs e IVs tengan valores por defecto
  const safeEvs = evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const safeIvs = ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

  // Calcular HP (fórmula especial)
  const hp = Math.floor(((2 * baseStats.hp + safeIvs.hp + Math.floor(safeEvs.hp / 4)) * level) / 100) + level + 10;

  // Calcular el resto de stats
  const atk = applyNatureMod(
    "atk",
    Math.floor(((2 * baseStats.atk + safeIvs.atk + Math.floor(safeEvs.atk / 4)) * level) / 100) + 5
  );
  const def = applyNatureMod(
    "def",
    Math.floor(((2 * baseStats.def + safeIvs.def + Math.floor(safeEvs.def / 4)) * level) / 100) + 5
  );
  const spa = applyNatureMod(
    "spa",
    Math.floor(((2 * baseStats.spa + safeIvs.spa + Math.floor(safeEvs.spa / 4)) * level) / 100) + 5
  );
  const spd = applyNatureMod(
    "spd",
    Math.floor(((2 * baseStats.spd + safeIvs.spd + Math.floor(safeEvs.spd / 4)) * level) / 100) + 5
  );
  const spe = applyNatureMod(
    "spe",
    Math.floor(((2 * baseStats.spe + safeIvs.spe + Math.floor(safeEvs.spe / 4)) * level) / 100) + 5
  );

  return { hp, atk, def, spa, spd, spe };
};

const TeamMaker = memo(() => {
  const { isAllDataLoaded, isLoading, pokemons, moves, items, abilities } = usePokemonData();
  const { teamId } = useParams();
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [error, setError] = useState(null);
  const [teamName, setTeamName] = useState("");
  const { setPokemon, setMove, setItem, setAbility, updatePokemonStats } = useTeam();
  const navigate = useNavigate();

  // Ref para controlar si ya se ha cargado el equipo
  const teamLoadedRef = useRef(false);

  console.log("🔴 TeamMaker component rendered, teamId:", teamId);

  // Manejar errores y redireccionar si es necesario
  useEffect(() => {
    if (error && error.includes("no encontrado")) {
      // Si el equipo no existe, mostrar el error por 3 segundos y luego redireccionar
      const timer = setTimeout(() => {
        navigate("/teams");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  // Cargar equipo si estamos en modo edición - SOLO UNA VEZ
  useEffect(() => {
    // Solo cargar si tenemos ID, datos cargados, no estamos ya cargando y no hemos cargado el equipo antes
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

          // Marcar que hemos cargado el equipo
          teamLoadedRef.current = true;

          // Guardar el nombre del equipo para usarlo en el botón de guardar
          setTeamName(teamData.name || "");

          // Verificar que el equipo tenga Pokémon
          if (!teamData.pokemon || !teamData.pokemon.length) {
            console.warn("⚠️ Team has no Pokémon");
            setLoadingTeam(false);
            return;
          }

          // Debug: Imprimir todos los pokémon del equipo
          console.log("Team Pokémon:", teamData.pokemon);

          // Cargar cada Pokémon en el TeamContext
          teamData.pokemon.forEach((pokemonData) => {
            console.log("Loading Pokémon data:", pokemonData);
            try {
              const slotIndex = pokemonData.slot - 1; // Ajustar slot (1-6) a índice (0-5)

              // Buscar el objeto Pokémon completo
              const pokemonObj = pokemons.find(
                (p) =>
                  p.id === pokemonData.pokemon_id || p.name.toLowerCase() === pokemonData.pokemon_name.toLowerCase()
              );

              if (pokemonObj) {
                // Primero cargamos los datos básicos del Pokémon
                setPokemon(slotIndex, pokemonObj);

                // Debug: mostrar información sobre habilidad e item
                console.log(
                  `Pokémon ${pokemonData.pokemon_name} ability: ${pokemonData.build?.ability_id}, item: ${pokemonData.build?.item_id}`
                );

                // Cargar la habilidad exactamente como viene de la base de datos
                if (pokemonData.build && pokemonData.build.ability_id) {
                  const abilityId = pokemonData.build.ability_id;
                  console.log(`Setting ability from DB: ${abilityId} for ${pokemonData.pokemon_name}`);

                  // Buscar el nombre para mostrar en la UI, manteniendo el ID original
                  const abilityName = getDisplayNameForAbility(abilityId);

                  // Establecer la habilidad con el nombre encontrado (o el ID original como fallback)
                  // y guardando siempre el ID original como está en la BD
                  setAbility(slotIndex, abilityName, abilityId);
                }

                // Cargar el item exactamente como viene de la base de datos
                if (pokemonData.build && pokemonData.build.item_id) {
                  const itemId = pokemonData.build.item_id;
                  console.log(`Setting item from DB: ${itemId} for ${pokemonData.pokemon_name}`);

                  // Buscar el nombre para mostrar en la UI, manteniendo el ID original
                  const itemName = getDisplayNameForItem(itemId);

                  // Establecer el item con el nombre encontrado (o el ID original como fallback)
                  // y guardando siempre el ID original como está en la BD
                  setItem(slotIndex, itemName, itemId);
                }

                // Cargar movimientos como vienen de la base de datos
                if (pokemonData.moves && pokemonData.moves.length) {
                  pokemonData.moves.forEach((moveId, moveIndex) => {
                    if (moveId) {
                      console.log(`Setting move ${moveIndex} from DB: ${moveId} for ${pokemonData.pokemon_name}`);

                      // Buscar el nombre del movimiento para la UI
                      const moveName = getDisplayNameForMove(moveId);

                      // Siempre guardamos el moveId original
                      setMove(slotIndex, moveIndex, moveName);
                    }
                  });
                }

                // Cargar EVs, IVs y naturaleza
                const evs = pokemonData.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
                const ivs = pokemonData.ivs || { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
                const nature = pokemonData.nature || "Hardy";

                // Calcular stats a partir de las stats base del pokémon y los EVs e IVs
                const calculatedStats = calculatePokemonStats(pokemonObj.baseStats, evs, ivs, nature);

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
    // Por defecto usamos el ID como nombre
    let displayName = abilityId;

    try {
      // Buscar en todos los Pokémon y sus habilidades
      for (const pokemonId in abilities) {
        const pokemonAbilities = abilities[pokemonId];

        if (pokemonAbilities?.abilities) {
          for (const type in pokemonAbilities.abilities) {
            const ability = pokemonAbilities.abilities[type];

            // Las habilidades se guardan como [nombre, descripción, id]
            if (Array.isArray(ability) && ability.length >= 3) {
              const name = ability[0];
              const id = ability[2];

              // Si encontramos coincidencia exacta por ID
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
    // Por defecto usamos el ID como nombre
    let displayName = itemId;

    try {
      // Búsqueda directa por key
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

  // Función auxiliar para obtener el nombre de visualización de un movimiento a partir de su ID
  const getDisplayNameForMove = (moveId) => {
    // Por defecto usamos el ID como nombre
    let displayName = moveId;

    try {
      // Búsqueda directa por key
      if (moves && moves[moveId] && moves[moveId].name) {
        displayName = moves[moveId].name;
        console.log(`Found move display name: ${displayName} for ID: ${moveId}`);
        return displayName;
      }

      console.log(`Using original ID as display name for move: ${moveId}`);
      return displayName;
    } catch (err) {
      console.error(`Error getting display name for move: ${moveId}`, err);
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
