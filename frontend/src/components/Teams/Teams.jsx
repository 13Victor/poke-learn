// pages/Teams.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTeam } from "../../contexts/TeamContext";
import apiService from "../../services/apiService";
import TeamsGrid from "./TeamsGrid";
import { FaPlus } from "react-icons/fa6";
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

  const handleToggleFavorite = async (teamId, isFavorite) => {
    try {
      setLoadingAction(true);
      console.log(`⭐ ${isFavorite ? "Adding to" : "Removing from"} favorites team with ID: ${teamId}`);

      const response = await apiService.toggleTeamFavorite(teamId, isFavorite);
      if (!response.success) {
        throw new Error(response.message || "Error al actualizar favorito");
      }

      console.log("✅ Team favorite status updated successfully");

      // Actualizar el estado local inmediatamente para una mejor UX
      setTeams((prevTeams) =>
        prevTeams.map((team) => (team.id === teamId ? { ...team, is_favorite: isFavorite } : team))
      );

      // Opcional: refrescar desde el servidor para asegurar sincronización
      // fetchTeams();
    } catch (err) {
      console.error("❌ Error al actualizar favorito:", err);
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
            <FaPlus className="icon" />
            New Team
          </button>
        </div>

        <TeamsGrid
          teams={teams}
          onCreateTeam={handleCreateTeam}
          onEditTeam={handleEditTeam}
          onDeleteTeam={handleDeleteTeam}
          onToggleFavorite={handleToggleFavorite}
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

      <div className="separator-line"></div>

      <div className="teams-additional-info">
        <TeamAdditionalInfo teams={teams} selectedTeamId={selectedTeamId} onSelectTeam={handleSelectTeam} />
      </div>
    </div>
  );
};

export default Teams;
