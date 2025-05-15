import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import apiService from "../../services/apiService";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, setError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    fetchTeams();
  }, [isAuthenticated, navigate]);

  const fetchTeams = async () => {
    try {
      const response = await apiService.getTeams();
      if (!response.success) {
        throw new Error(response.message || "Error al obtener equipos");
      }

      // Fix: Access the teams array inside the data object
      setTeams(response.data.teams);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener equipos:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    navigate("/teammaker");
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      const response = await apiService.deleteTeam(teamId);
      if (!response.success) {
        throw new Error(response.message || "Error al eliminar equipo");
      }

      fetchTeams(); // Actualizar lista de equipos
    } catch (err) {
      console.error("Error al eliminar equipo:", err);
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
                {team.pokemon &&
                  team.pokemon.map((pokemon, index) => (
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
