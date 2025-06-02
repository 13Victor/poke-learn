// src/components/Battle/BattleSetup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/apiService";
import TeamCard from "../Teams/TeamCard";
import "../../styles/Battle/BattleSetup.css";
import { FaCheck } from "react-icons/fa6";

// Importar imágenes de entrenadores (asegúrate de tener estas imágenes en tu proyecto)
import easyTrainer from "../../../public/assets/trainers/easy.png";
import mediumTrainer from "../../../public/assets/trainers/normal.png";
import hardTrainer from "../../../public/assets/trainers/difficult.png";

const BattleSetup = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);

  // Cargar equipos del usuario al montar el componente
  useEffect(() => {
    loadUserTeams();
  }, []);

  const loadUserTeams = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeams();
      if (!response.success) {
        throw new Error(response.message || "Error al obtener equipos");
      }

      const teamsData = response.data?.teams || [];
      setTeams(teamsData);

      // Si hay equipos, seleccionar el primero por defecto
      if (teamsData.length > 0) {
        setSelectedTeam(teamsData[0]);
      }

      setError(null);
    } catch (err) {
      console.error("Error al cargar equipos:", err);
      setError("No se pudieron cargar los equipos. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartBattle = () => {
    if (!selectedTeam) {
      setError("Debes seleccionar un equipo para comenzar la batalla.");
      return;
    }

    // Guardar la configuración en localStorage para usar en Combat
    const battleConfig = {
      team: selectedTeam,
      difficulty,
      format: "gen9randombattle", // Formato fijo
    };

    localStorage.setItem("battleConfig", JSON.stringify(battleConfig));

    // Navegar a la batalla
    navigate("/battle/combat");
  };

  // Funciones dummy para TeamCard (no las usaremos pero son requeridas)
  const handleEditTeam = (teamId) => {
    navigate(`/teammaker/${teamId}`);
  };

  const handleDeleteTeam = async (teamId) => {
    // No permitir eliminar desde aquí, redirigir a Teams
    navigate("/teams");
  };

  const handleToggleFavorite = async (teamId, isFavorite) => {
    try {
      setLoadingAction(true);
      const response = await apiService.toggleTeamFavorite(teamId, isFavorite);
      if (!response.success) {
        throw new Error(response.message || "Error al actualizar favorito");
      }

      // Actualizar el estado local
      setTeams((prevTeams) =>
        prevTeams.map((team) => (team.id === teamId ? { ...team, is_favorite: isFavorite } : team))
      );
    } catch (err) {
      console.error("Error al actualizar favorito:", err);
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando equipos...</p>
      </div>
    );
  }

  // Separar equipos favoritos de los normales (igual que en Teams)
  const favoriteTeams = teams.filter((team) => team.is_favorite);
  const regularTeams = teams.filter((team) => !team.is_favorite);

  return (
    <div className="battle-setup-page">
      <div className="battle-setup-container">
        {/* Selector de equipo usando la misma estructura que Teams */}
        <div className="setup-section">
          <h3>Selecciona tu Equipo</h3>

          {teams.length === 0 ? (
            <div className="no-teams-message">
              <p>No tienes equipos creados.</p>
              <p>Ve a la sección de equipos para crear tu primer equipo antes de comenzar una batalla.</p>
              <button onClick={() => navigate("/teams")}>Ir a Equipos</button>
            </div>
          ) : (
            <div className="teams-grid-container">
              {/* Sección de Favoritos */}
              {favoriteTeams.length > 0 && (
                <div className="teams-section">
                  <h4 className="section-title">⭐ Favoritos ({favoriteTeams.length})</h4>
                  <div className="teams-grid">
                    {favoriteTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onEdit={handleEditTeam}
                        onDelete={handleDeleteTeam}
                        onToggleFavorite={handleToggleFavorite}
                        loadingAction={loadingAction}
                        onSelectTeam={handleSelectTeam}
                        isSelected={selectedTeam?.id === team.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sección de todos los equipos */}
              {regularTeams.length > 0 && (
                <div className="teams-section">
                  <h4 className="section-title">📂 Todos los Equipos ({regularTeams.length})</h4>
                  <div className="teams-grid">
                    {regularTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onEdit={handleEditTeam}
                        onDelete={handleDeleteTeam}
                        onToggleFavorite={handleToggleFavorite}
                        loadingAction={loadingAction}
                        onSelectTeam={handleSelectTeam}
                        isSelected={selectedTeam?.id === team.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {teams.length > 0 && (
            <div className="teams-actions">
              <button className="manage-teams-btn" onClick={() => navigate("/teams")}>
                Gestionar Equipos
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="separator-line"></div>
      <div className="combat-details-container">
        <div className="battle-setup-header">
          <h1>Configuración de Batalla</h1>
          <p className="setup-description">
            Configura tu batalla seleccionando un equipo y la dificultad del oponente.
          </p>
        </div>

        {error && (
          <div className="error-notification">
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="setup-section">
          <h3>Dificultad del Oponente</h3>
          <div className="trainer-difficulty-selector">
            <div
              className={`trainer-option easy ${difficulty === "easy" ? "selected" : ""}`}
              onClick={() => setDifficulty("easy")}
            >
              <div className="image-difficult-container">
                <img src={easyTrainer} alt="Entrenador fácil" />
                {difficulty === "easy" && <FaCheck className="difficulty-check" />}
              </div>
              <div className="trainer-info">
                <h4>Easy</h4>
              </div>
            </div>

            <div
              className={`trainer-option medium ${difficulty === "medium" ? "selected" : ""}`}
              onClick={() => setDifficulty("medium")}
            >
              <div className="image-difficult-container">
                <img src={mediumTrainer} alt="Entrenador medio" />
                {difficulty === "medium" && <FaCheck className="difficulty-check" />}
              </div>
              <div className="trainer-info">
                <h4>Medium</h4>
              </div>
            </div>

            <div
              className={`trainer-option hard ${difficulty === "hard" ? "selected" : ""}`}
              onClick={() => setDifficulty("hard")}
            >
              <div className="image-difficult-container">
                <img src={hardTrainer} alt="Entrenador difícil" />
                {difficulty === "hard" && <FaCheck className="difficulty-check" />}
              </div>
              <div className="trainer-info">
                <h4>Hard</h4>
              </div>
            </div>
          </div>
        </div>

        {selectedTeam && (
          <div className="selected-team-info">
            <h4>Equipo seleccionado: {selectedTeam.name}</h4>
            {selectedTeam.is_favorite && <span className="favorite-badge">⭐ Favorito</span>}
          </div>
        )}

        {/* Botón de inicio */}
        <div className="setup-actions">
          <button
            className="start-battle-btn"
            onClick={handleStartBattle}
            disabled={!selectedTeam || teams.length === 0}
          >
            {!selectedTeam || teams.length === 0 ? "Selecciona un equipo para continuar" : "Comenzar Batalla"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BattleSetup;
