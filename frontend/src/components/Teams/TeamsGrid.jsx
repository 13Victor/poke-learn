// components/teams/TeamsGrid.jsx
import TeamCard from "./TeamCard";

const TeamsGrid = ({
  teams,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
  onToggleFavorite,
  loadingAction,
  onSelectTeam,
  selectedTeamId,
}) => {
  // Separar equipos favoritos de los normales
  const favoriteTeams = teams.filter((team) => team.is_favorite);
  const regularTeams = teams.filter((team) => !team.is_favorite);

  if (teams.length === 0) {
    return (
      <div className="no-teams-message">
        <p>You don't have any teams yet. Create your first team!</p>
        <button onClick={onCreateTeam}>Create Team</button>
      </div>
    );
  }

  return (
    <div className="teams-grid-container">
      {/* Sección de Favoritos */}
      {favoriteTeams.length > 0 && (
        <div className="teams-section favorites">
          <h3 className="section-title">Favorites ({favoriteTeams.length})</h3>
          <div className="teams-grid">
            {favoriteTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={onEditTeam}
                onDelete={onDeleteTeam}
                onToggleFavorite={onToggleFavorite}
                loadingAction={loadingAction}
                onSelectTeam={onSelectTeam}
                isSelected={selectedTeamId === team.id}
              />
            ))}
          </div>
        </div>
      )}

      {regularTeams.length > 0 && (
        <div className="teams-section">
          <h3 className="section-title">All Teams ({regularTeams.length})</h3>
          <div className="teams-grid">
            {regularTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={onEditTeam}
                onDelete={onDeleteTeam}
                onToggleFavorite={onToggleFavorite}
                loadingAction={loadingAction}
                onSelectTeam={onSelectTeam}
                isSelected={selectedTeamId === team.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsGrid;
