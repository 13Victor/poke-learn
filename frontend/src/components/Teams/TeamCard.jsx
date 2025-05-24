// components/teams/TeamCard.jsx
import { HiOutlineTrash } from "react-icons/hi";
import { RiEditLine } from "react-icons/ri";

const TeamCard = ({ team, onEdit, onDelete, loadingAction, onSelectTeam, isSelected }) => {
  return (
    <div className={`team-card ${isSelected ? "selected" : ""}`} onClick={() => onSelectTeam(team)}>
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
