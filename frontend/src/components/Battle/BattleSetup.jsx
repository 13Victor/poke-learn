// src/components/Battle/BattleSetup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/apiService";
import TeamCard from "../Teams/TeamCard";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import "../../styles/Battle/BattleSetup.css";
import { FaCheck } from "react-icons/fa6";

// Importar imágenes de entrenadores (asegúrate de tener estas imágenes en tu proyecto)
import easyTrainer from "../../../public/assets/trainers/easy.png";
import mediumTrainer from "../../../public/assets/trainers/normal.png";
import hardTrainer from "../../../public/assets/trainers/difficult.png";

const BattleSetup = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);

  // Obtener los datos de Pokémon del contexto
  const { moves, abilities, items, isAllDataLoaded } = usePokemonData();

  // Cargar equipos del usuario al montar el componente
  useEffect(() => {
    loadUserTeams();
  }, []);

  // Función para validar si un Pokémon está completo
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

  // Función para verificar si el equipo está completo (sin warnings ni errors)
  const getTeamStatus = (team) => {
    if (!team.pokemon || team.pokemon.length === 0) {
      return "incomplete"; // Equipo vacío
    }

    if (team.pokemon.length !== 6) {
      return "incomplete"; // No tiene 6 Pokémon
    }

    let missingEvs = false;
    let missingOtherRequirements = false;

    team.pokemon.forEach((pokemon) => {
      const { hasAllMoves, hasAbility, hasItem, hasAllEvs } = isPokemonComplete(pokemon);
      if (!hasAllEvs) missingEvs = true;
      if (!hasAllMoves || !hasAbility || !hasItem) missingOtherRequirements = true;
    });

    if (missingOtherRequirements) return "missing-requirements";
    if (missingEvs) return "missing-evs";

    return "complete"; // Equipo perfecto
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

  // Función para filtrar solo equipos completos
  const filterCompleteTeams = (teamsList) => {
    return teamsList.filter((team) => getTeamStatus(team) === "complete");
  };

  // Función para convertir equipo a formato JSON de Pokémon Showdown
  const convertTeamToShowdownFormat = (team) => {
    if (!team.pokemon || team.pokemon.length === 0) {
      return [];
    }

    return team.pokemon.map((pokemon) => {
      // Convertir IDs de movimientos a nombres usando el contexto
      const pokemonMoves =
        pokemon.moves
          ?.map((moveId) => {
            if (!moveId || moveId.trim() === "") return null;

            // Buscar el movimiento en los datos cargados
            const move = moves[moveId];
            return move ? move.name : moveId; // Si no encuentra el nombre, usar el ID
          })
          .filter(Boolean) || []; // Filtrar valores nulos/vacíos

      // Convertir ID de habilidad a nombre
      const abilityName = pokemon.ability_id ? getDisplayNameForAbility(pokemon.ability_id) : "";

      // Convertir ID de item a nombre
      const itemName = pokemon.item_id ? getDisplayNameForItem(pokemon.item_id) : "";

      return {
        name: "", // Nickname vacío por defecto
        species: pokemon.pokemon_name || pokemon.name,
        gender: "", // Por defecto vacío, podrías agregarlo si tienes esta info
        item: itemName,
        ability: abilityName,
        evs: {
          hp: pokemon.evs?.hp || 0,
          atk: pokemon.evs?.atk || 0,
          def: pokemon.evs?.def || 0,
          spa: pokemon.evs?.spa || 0,
          spd: pokemon.evs?.spd || 0,
          spe: pokemon.evs?.spe || 0,
        },
        nature: pokemon.nature || "Hardy",
        ivs: {
          hp: pokemon.ivs?.hp || 31,
          atk: pokemon.ivs?.atk || 31,
          def: pokemon.ivs?.def || 31,
          spa: pokemon.ivs?.spa || 31,
          spd: pokemon.ivs?.spd || 31,
          spe: pokemon.ivs?.spe || 31,
        },
        moves: pokemonMoves,
      };
    });
  };

  const loadUserTeams = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeams();
      if (!response.success) {
        throw new Error(response.message || "Error al obtener equipos");
      }

      const teamsData = response.data?.teams || [];

      // Filtrar solo equipos completos (sin warnings ni errors)
      const completeTeams = filterCompleteTeams(teamsData);
      setTeams(completeTeams);

      setError(null);
    } catch (err) {
      console.error("Error al cargar equipos:", err);
      setError("No se pudieron cargar los equipos. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBattle = () => {
    if (!selectedTeam) {
      setError("Debes seleccionar un equipo para comenzar la batalla.");
      return;
    }

    // Convert team to Showdown format
    const playerTeamShowdown = convertTeamToShowdownFormat(selectedTeam);

    // Rival team in export format for gen9ou (more competitive team)
    const rivalTeamExport = `
Gholdengo @ Choice Specs  
Ability: Good as Gold  
Tera Type: Fighting  
EVs: 252 SpA / 4 SpD / 252 Spe  
Timid Nature  
IVs: 0 Atk  
- Shadow Ball  
- Make It Rain  
- Focus Blast  
- Trick  

Kingambit @ Leftovers  
Ability: Supreme Overlord  
Tera Type: Ghost  
EVs: 200 HP / 252 Atk / 56 Spe  
Adamant Nature  
- Iron Head  
- Sucker Punch  
- Low Kick  
- Swords Dance  

Great Tusk @ Booster Energy  
Ability: Protosynthesis  
Tera Type: Ice  
EVs: 252 Atk / 4 Def / 252 Spe  
Jolly Nature  
- Headlong Rush  
- Ice Spinner  
- Knock Off  
- Rapid Spin  

Dragapult @ Choice Band  
Ability: Clear Body  
Tera Type: Ghost  
EVs: 252 Atk / 4 SpA / 252 Spe  
Naive Nature  
- Dragon Darts  
- Tera Blast  
- U-turn  
- Phantom Force  

Toxapex @ Black Sludge  
Ability: Regenerator  
Tera Type: Water  
EVs: 252 HP / 252 Def / 4 SpD  
Bold Nature  
IVs: 0 Atk  
- Scald  
- Recover  
- Haze  
- Toxic Spikes  

Raging Bolt @ Leftovers  
Ability: Protosynthesis  
Tera Type: Grass  
EVs: 252 HP / 4 SpA / 252 SpD  
Calm Nature  
IVs: 0 Atk  
- Thunderbolt  
- Draco Meteor  
- Calm Mind  
- Protect`;

    console.log("🎯 Player team in Showdown JSON format:");
    console.log(JSON.stringify(playerTeamShowdown, null, 2));

    // Save battle configuration
    const battleConfig = {
      team: selectedTeam,
      playerTeamShowdown: playerTeamShowdown,
      rivalTeamExport: rivalTeamExport,
      difficulty,
      format: "gen9ou", // Changed to gen9ou
    };

    localStorage.setItem("battleConfig", JSON.stringify(battleConfig));
    navigate("/battle/combat");
  };

  // Funciones dummy para TeamCard (no las usaremos pero son requeridas)
  const handleEditTeam = (teamId) => {
    navigate(`/teammaker/${teamId}`);
  };

  const handleDeleteTeam = async (teamId) => {
    // No permitir eliminar desde aquí, redirigir a Teams
    navigate("/teams");
  };

  const handleToggleFavorite = async (teamId, isFavorite) => {
    try {
      setLoadingAction(true);
      const response = await apiService.toggleTeamFavorite(teamId, isFavorite);
      if (!response.success) {
        throw new Error(response.message || "Error al actualizar favorito");
      }

      // Actualizar el estado local
      setTeams((prevTeams) =>
        prevTeams.map((team) => (team.id === teamId ? { ...team, is_favorite: isFavorite } : team))
      );
    } catch (err) {
      console.error("Error al actualizar favorito:", err);
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);

    // Solo hacer console.log si los datos están cargados
    if (isAllDataLoaded) {
      // Console.log del equipo en formato JSON de Pokémon Showdown
      const showdownTeam = convertTeamToShowdownFormat(team);
      console.log("🎯 Equipo seleccionado en formato JSON de Pokémon Showdown:");
      console.log(JSON.stringify(showdownTeam, null, 2));
    } else {
      console.log("⏳ Datos aún cargando, esperando para mostrar el JSON del equipo...");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando equipos...</p>
      </div>
    );
  }

  // Separar equipos favoritos de los normales (igual que en Teams)
  const favoriteTeams = teams.filter((team) => team.is_favorite);
  const regularTeams = teams.filter((team) => !team.is_favorite);

  return (
    <div className="battle-setup-page">
      <div className="battle-setup-container">
        {/* Selector de equipo usando la misma estructura que Teams */}
        <div className="setup-section">
          <h3>Selecciona tu Equipo</h3>

          {teams.length === 0 ? (
            <div className="no-teams-message">
              <p>No tienes equipos completos listos para batalla.</p>
              <p>Ve a la sección de equipos para completar tus equipos antes de comenzar una batalla.</p>
              <p>
                <small>Solo se muestran equipos con 6 Pokémon completos (movimientos, habilidad, objeto y EVs).</small>
              </p>
              <button onClick={() => navigate("/teams")}>Ir a Equipos</button>
            </div>
          ) : (
            <div className="teams-grid-container">
              {/* Sección de Favoritos */}
              {favoriteTeams.length > 0 && (
                <div className="teams-section">
                  <h4 className="section-title">⭐ Favoritos ({favoriteTeams.length})</h4>
                  <div className="teams-grid">
                    {favoriteTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onEdit={handleEditTeam}
                        onDelete={handleDeleteTeam}
                        onToggleFavorite={handleToggleFavorite}
                        loadingAction={loadingAction}
                        onSelectTeam={handleSelectTeam}
                        isSelected={selectedTeam?.id === team.id}
                        hideBattleActions={true} // Nueva prop para ocultar botones
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sección de todos los equipos */}
              {regularTeams.length > 0 && (
                <div className="teams-section">
                  <h4 className="section-title">📂 Equipos Completos ({regularTeams.length})</h4>
                  <div className="teams-grid">
                    {regularTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onEdit={handleEditTeam}
                        onDelete={handleDeleteTeam}
                        onToggleFavorite={handleToggleFavorite}
                        loadingAction={loadingAction}
                        onSelectTeam={handleSelectTeam}
                        isSelected={selectedTeam?.id === team.id}
                        hideBattleActions={true} // Nueva prop para ocultar botones
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {teams.length > 0 && (
            <div className="teams-actions">
              <button className="manage-teams-btn" onClick={() => navigate("/teams")}>
                Gestionar Equipos
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="separator-line"></div>
      <div className="combat-details-container">
        <div className="battle-setup-header">
          <h1>Configuración de Batalla</h1>
          <p className="setup-description">
            Configura tu batalla seleccionando un equipo y la dificultad del oponente.
            <br />
            <strong>Formato: Gen 9 OU</strong> - Batalla competitiva con vista previa de equipos.
          </p>
        </div>

        {error && (
          <div className="error-notification">
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="setup-section">
          <h3>Dificultad del Oponente</h3>
          <div className="trainer-difficulty-selector">
            <div
              className={`trainer-option easy ${difficulty === "easy" ? "selected" : ""}`}
              onClick={() => setDifficulty("easy")}
            >
              <div className="image-difficult-container">
                <img src={easyTrainer} alt="Entrenador fácil" />
                {difficulty === "easy" && <FaCheck className="difficulty-check" />}
              </div>
              <div className="trainer-info">
                <h4>Easy</h4>
              </div>
            </div>

            <div
              className={`trainer-option medium ${difficulty === "medium" ? "selected" : ""}`}
              onClick={() => setDifficulty("medium")}
            >
              <div className="image-difficult-container">
                <img src={mediumTrainer} alt="Entrenador medio" />
                {difficulty === "medium" && <FaCheck className="difficulty-check" />}
              </div>
              <div className="trainer-info">
                <h4>Medium</h4>
              </div>
            </div>

            <div
              className={`trainer-option hard ${difficulty === "hard" ? "selected" : ""}`}
              onClick={() => setDifficulty("hard")}
            >
              <div className="image-difficult-container">
                <img src={hardTrainer} alt="Entrenador difícil" />
                {difficulty === "hard" && <FaCheck className="difficulty-check" />}
              </div>
              <div className="trainer-info">
                <h4>Hard</h4>
              </div>
            </div>
          </div>
        </div>

        {selectedTeam && (
          <div className="selected-team-info">
            <h4>Equipo seleccionado: {selectedTeam.name}</h4>
            {selectedTeam.is_favorite && <span className="favorite-badge">⭐ Favorito</span>}
          </div>
        )}

        {/* Botón de inicio */}
        <div className="setup-actions">
          <button
            className="start-battle-btn"
            onClick={handleStartBattle}
            disabled={!selectedTeam || teams.length === 0}
          >
            {!selectedTeam || teams.length === 0 ? "Selecciona un equipo para continuar" : "Comenzar Batalla Gen 9 OU"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleSetup;
