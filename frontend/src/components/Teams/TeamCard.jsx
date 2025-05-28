import { HiOutlineTrash } from "react-icons/hi";
import { RiEditLine } from "react-icons/ri";
import { FaExclamationCircle, FaExclamationTriangle, FaStar, FaRegStar } from "react-icons/fa";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

const TeamCard = ({ team, onEdit, onDelete, onToggleFavorite, loadingAction, onSelectTeam, isSelected }) => {
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

  // Función para verificar si el equipo está completo
  const getTeamStatus = () => {
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

  const teamStatus = getTeamStatus();

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(team.id, !team.is_favorite);
  };

  return (
    <div className={`team-card ${isSelected ? "selected" : ""}`} onClick={() => onSelectTeam(team)}>
      {/* Estrella de favorito */}

      {teamStatus === "missing-evs" && (
        <Tippy content="Missing EVs" placement="top" theme="warning">
          <div className="team-warning-icon">
            <FaExclamationTriangle />
          </div>
        </Tippy>
      )}
      {teamStatus === "missing-requirements" && (
        <Tippy content="Incomplete Team" placement="top" theme="danger">
          <div className="team-error-icon">
            <FaExclamationCircle />
          </div>
        </Tippy>
      )}

      <h5 className="team-title">{team.name}</h5>
      <div className="pokemon-grid">
        {Array.isArray(team.pokemon) && team.pokemon.length > 0 ? (
          team.pokemon
            .sort((a, b) => (a.slot || 0) - (b.slot || 0))
            .map((pokemon, index) => (
              <div key={pokemon.id || index} className="pokemon">
                <img
                  className="pokemon-sprite"
                  src={`/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`}
                  alt={pokemon.name || "Unknown"}
                  title={pokemon.name || "Unknown"}
                  onError={(e) => {
                    console.warn(`Failed to load image for ${pokemon.name}`);
                    e.target.src = "/assets/pokemon-small-hd-sprites-webp/0000.webp";
                  }}
                />
                {pokemon.item_id && (
                  <img
                    className="item-sprite"
                    src={`/assets/items/${pokemon.item_id}.webp`}
                    alt={pokemon.item_id}
                    title={pokemon.item_id}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>
            ))
        ) : (
          <p className="empty-team">No Pokémon in this team</p>
        )}
      </div>
      <div className="team-actions">
        <Tippy content={team.is_favorite ? "Remove from favorites" : "Add to favorites"} placement="top" theme="info">
          <button
            className="favorite-button"
            onClick={handleFavoriteClick}
            disabled={loadingAction}
            style={{
              color: team.is_favorite ? "#ffd000" : "",
            }}
          >
            {team.is_favorite ? <FaStar /> : <FaRegStar />}
          </button>
        </Tippy>
        <Tippy content="Edit Team" placement="top" theme="info">
          <button
            className="edit-button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(team.id);
            }}
            disabled={loadingAction}
          >
            <RiEditLine />
          </button>
        </Tippy>
        <Tippy content="Delete Team" placement="top" theme="danger">
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(team.id);
            }}
            disabled={loadingAction}
          >
            <HiOutlineTrash />
          </button>
        </Tippy>
      </div>
    </div>
  );
};

export default TeamCard;
