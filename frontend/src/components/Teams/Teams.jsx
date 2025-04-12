import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("http://localhost:5000/teams", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    navigate("/teammaker");
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      const response = await fetch(`http://localhost:5000/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete team");
      fetchTeams(); // Refresh teams list
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading teams...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="teams-container">
      <div className="teams-header">
        <h1>My Teams</h1>
        <button className="create-team-button" onClick={handleCreateTeam}>
          Create New Team
        </button>
      </div>

      <div className="teams-grid">
        {teams.length === 0 ? (
          <p>No teams yet. Create your first team!</p>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="team-card">
              <h3>{team.name}</h3>
              <div className="team-preview">
                {team.pokemon.map((pokemon, index) => (
                  <div key={index} className="pokemon-preview">
                    <h4>{pokemon.name}</h4>
                    <img src={`/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`} alt={pokemon.name} />
                  </div>
                ))}
              </div>
              <div className="team-actions">
                <button onClick={() => navigate(`/teammaker/${team.id}`)}>Edit</button>
                <button onClick={() => handleDeleteTeam(team.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Teams;
