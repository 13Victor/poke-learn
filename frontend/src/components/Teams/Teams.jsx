// pages/Teams.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTeam } from "../../contexts/TeamContext";
import apiService from "../../services/apiService";
import TeamsGrid from "./TeamsGrid";
import TeamAdditionalInfo from "./TeamAdditionalInfo";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
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
      // Seleccionar el primer equipo por defecto si existe
      if (response.data.teams && response.data.teams.length > 0) {
        setSelectedTeamId(response.data.teams[0].id);
      }
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
      // Si el equipo eliminado es el seleccionado, seleccionar otro
      if (teamId === selectedTeamId) {
        const remainingTeams = teams.filter((t) => t.id !== teamId);
        if (remainingTeams.length > 0) {
          setSelectedTeamId(remainingTeams[0].id);
        } else {
          setSelectedTeamId(null);
        }
      }
      fetchTeams();
    } catch (err) {
      console.error("❌ Error al eliminar equipo:", err);
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSelectTeam = (team) => {
    setSelectedTeamId(team.id);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your Pokémon teams...</p>
      </div>
    );
  }

  return (
    <div className="teams-page">
      <div className="teams-container">
        <div className="teams-header">
          <h1>My Teams</h1>
          <button className="create-team-button" onClick={handleCreateTeam} disabled={loadingAction}>
            Create New Team
          </button>
        </div>

        <TeamsGrid
          teams={teams}
          onCreateTeam={handleCreateTeam}
          onEditTeam={handleEditTeam}
          onDeleteTeam={handleDeleteTeam}
          loadingAction={loadingAction}
          onSelectTeam={handleSelectTeam}
          selectedTeamId={selectedTeamId}
        />

        {error && (
          <div className="error-notification">
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>

      <div className="teams-additional-info">
        <TeamAdditionalInfo teams={teams} selectedTeamId={selectedTeamId} onSelectTeam={handleSelectTeam} />
      </div>
    </div>
  );
};

export default Teams;
