// components/teams/TeamCard.jsx
import { HiOutlineTrash } from "react-icons/hi";
import { RiEditLine } from "react-icons/ri";
import { FaCircleExclamation } from "react-icons/fa6";

const TeamCard = ({ team, onEdit, onDelete, loadingAction, onSelectTeam, isSelected }) => {
  // Función para validar si un Pokémon está completo
  const isPokemonComplete = (pokemon) => {
    // Verificar que tenga 4 movimientos
    const hasAllMoves =
      pokemon.moves && pokemon.moves.length === 4 && pokemon.moves.every((move) => move && move.trim() !== "");

    // Verificar que tenga habilidad
    const hasAbility = pokemon.ability_id && pokemon.ability_id.trim() !== "";

    // Verificar que tenga item (opcional - comentar si no es requerido)
    const hasItem = pokemon.item_id && pokemon.item_id.trim() !== "";

    // Verificar que tenga todos los 504 EVs distribuidos
    const evs = pokemon.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    const totalEvs = Object.values(evs).reduce((sum, ev) => sum + (ev || 0), 0);
    const hasAllEvs = totalEvs === 508;

    return hasAllMoves && hasAbility && hasItem && hasAllEvs;
  };

  // Función para verificar si el equipo está completo
  const isTeamComplete = () => {
    if (!team.pokemon || team.pokemon.length === 0) {
      return false;
    }

    // Verificar que tenga 6 Pokémon
    if (team.pokemon.length !== 6) {
      return false;
    }

    // Verificar que todos los Pokémon estén completos
    return team.pokemon.every((pokemon) => isPokemonComplete(pokemon));
  };

  const teamComplete = isTeamComplete();

  return (
    <div className={`team-card ${isSelected ? "selected" : ""}`} onClick={() => onSelectTeam(team)}>
      {!teamComplete && (
        <div className="team-warning-icon">
          <FaCircleExclamation />
        </div>
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
      </div>
    </div>
  );
};

export default TeamCard;
