// components/teams/TeamsGrid.jsx
import TeamCard from "./TeamCard";

const TeamsGrid = ({ teams, onCreateTeam, onEditTeam, onDeleteTeam, loadingAction, onSelectTeam, selectedTeamId }) => {
  if (teams.length === 0) {
    return (
      <div className="no-teams-message">
        <p>You don't have any teams yet. Create your first team!</p>
        <button onClick={onCreateTeam}>Create Team</button>
      </div>
    );
  }

  return (
    <div className="teams-grid">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          onEdit={onEditTeam}
          onDelete={onDeleteTeam}
          loadingAction={loadingAction}
          onSelectTeam={onSelectTeam}
          isSelected={selectedTeamId === team.id}
        />
      ))}
    </div>
  );
};

export default TeamsGrid;
