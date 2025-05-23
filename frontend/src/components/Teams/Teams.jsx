import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTeam } from "../../contexts/TeamContext";
import apiService from "../../services/apiService";
import { HiOutlineTrash } from "react-icons/hi";
import { RiEditLine } from "react-icons/ri";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const { error, setError, isAuthenticated } = useAuth();
  const { resetTeam } = useTeam();
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
      setLoading(true);
      const response = await apiService.getTeams();
      if (!response.success) {
        throw new Error(response.message || "Error al obtener equipos");
      }

      setTeams(response.data.teams || []);
      console.log("✅ Teams loaded successfully:", response.data.teams);
    } catch (err) {
      console.error("❌ Error al obtener equipos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    resetTeam();
    console.log("🔄 Team state reset before creating new team");
    navigate("/teammaker");
  };

  const handleEditTeam = (teamId) => {
    navigate(`/teammaker/${teamId}`);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este equipo?")) {
      return;
    }

    try {
      setLoadingAction(true);
      console.log(`🗑️ Deleting team with ID: ${teamId}`);

      const response = await apiService.deleteTeam(teamId);
      if (!response.success) {
        throw new Error(response.message || "Error al eliminar equipo");
      }

      console.log("✅ Team deleted successfully");
      fetchTeams();
    } catch (err) {
      console.error("❌ Error al eliminar equipo:", err);
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your Pokémon teams...</p>
      </div>
    );

  return (
    <div className="teams-page">
      <div className="teams-container">
        <div className="teams-header">
          <h1>My Teams</h1>
          <button className="create-team-button" onClick={handleCreateTeam} disabled={loadingAction}>
            Create New Team
          </button>
        </div>

        <div className="teams-grid">
          {teams.length === 0 ? (
            <div className="no-teams-message">
              <p>You don't have any teams yet. Create your first team!</p>
              <button onClick={handleCreateTeam}>Create Team</button>
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="team-card">
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
                  <button className="edit-button" onClick={() => handleEditTeam(team.id)} disabled={loadingAction}>
                    <RiEditLine />
                  </button>
                  <button className="delete-button" onClick={() => handleDeleteTeam(team.id)} disabled={loadingAction}>
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <div className="error-notification">
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>
      <div className="teams-additional-info"></div>
    </div>
  );
};

export default Teams;
