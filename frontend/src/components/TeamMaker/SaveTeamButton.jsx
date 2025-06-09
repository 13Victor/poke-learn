import React, { useState, useEffect } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/apiService";
import { FaCheck } from "react-icons/fa6";
import { RiEditLine } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import "../../styles/Teams.css";

const SaveTeamButton = ({ teamId, initialTeamName = "" }) => {
  const { pokemons } = useTeam();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState(initialTeamName);
  const [newTeamName, setNewTeamName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Actualizar el nombre del equipo si cambia el initialTeamName
  useEffect(() => {
    if (initialTeamName) {
      setTeamName(initialTeamName);
    }
  }, [initialTeamName]);

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
    // Si no hay nombre inicial, empezar en modo edición
    if (!teamName.trim()) {
      setIsEditingName(true);
      setNewTeamName("");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditingName(false);
    setNewTeamName("");
    setError(null);
  };

  // Cerrar modal al hacer click fuera
  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeModal();
    }
  };

  const startEditingName = () => {
    setIsEditingName(true);
    setNewTeamName(teamName);
    setError(null);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setNewTeamName("");
    setError(null);
  };

  const saveTeamName = () => {
    if (!newTeamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setTeamName(newTeamName.trim());
    setIsEditingName(false);
    setNewTeamName("");
    setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      saveTeamName();
    } else if (e.key === "Escape") {
      cancelEditingName();
    }
  };

  const handleSave = async () => {
    // Validar que tenemos un nombre de equipo
    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Filtrar Pokémon vacíos (sin nombre)
      const validPokemons = pokemons.filter((pokemon) => pokemon.name);

      if (validPokemons.length === 0) {
        throw new Error("Team must have at least one Pokémon");
      }

      // Preparar datos del equipo
      const teamData = {
        name: teamName,
        pokemon: validPokemons.map((pokemon, index) => {
          // Debug: Mostrar IVs originales
          console.log(`SaveTeamButton - Pokémon ${pokemon.name} IVs originales:`, pokemon.ivs);

          // Asegurarnos de que tenemos los IDs correctos
          const itemId = pokemon.itemId || pokemon.item || "";
          const abilityId = pokemon.abilityId || pokemon.ability || "";
          const moveIds = pokemon.moveset
            .filter((move) => move)
            .map((move) => {
              // Si el movimiento es un objeto, extraer el ID, si no, usar el valor directamente
              if (typeof move === "object" && move.id) {
                return move.id;
              } else if (typeof move === "string" && move) {
                return move;
              }
              return null;
            })
            .filter((moveId) => moveId !== null);

          // PROBLEMA ENCONTRADO: Usar el operador || cuando lidiamos con valores que pueden ser 0
          // Cuando ivs.spe es 0, la expresión ivs.spe || 31 evalúa a 31, ya que 0 es falsy en JavaScript

          // SOLUCIÓN: Usar verificación explícita para undefined
          const evsObject = {
            hp: pokemon.evs?.hp !== undefined ? pokemon.evs.hp : 0,
            atk: pokemon.evs?.atk !== undefined ? pokemon.evs.atk : 0,
            def: pokemon.evs?.def !== undefined ? pokemon.evs.def : 0,
            spa: pokemon.evs?.spa !== undefined ? pokemon.evs.spa : 0,
            spd: pokemon.evs?.spd !== undefined ? pokemon.evs.spd : 0,
            spe: pokemon.evs?.spe !== undefined ? pokemon.evs.spe : 0,
          };

          const ivsObject = {
            hp: pokemon.ivs?.hp !== undefined ? pokemon.ivs.hp : 31,
            atk: pokemon.ivs?.atk !== undefined ? pokemon.ivs.atk : 31,
            def: pokemon.ivs?.def !== undefined ? pokemon.ivs.def : 31,
            spa: pokemon.ivs?.spa !== undefined ? pokemon.ivs.spa : 31,
            spd: pokemon.ivs?.spd !== undefined ? pokemon.ivs.spd : 31,
            spe: pokemon.ivs?.spe !== undefined ? pokemon.ivs.spe : 31,
          };

          // Debug: Mostrar IVs procesados
          console.log(`SaveTeamButton - Pokémon ${pokemon.name} IVs procesados:`, ivsObject);

          return {
            pokemon_name: pokemon.name,
            pokemon_id: pokemon.id,
            level: pokemon.level || 100,
            image: pokemon.image,
            nature: pokemon.nature || "Hardy",
            evs: evsObject,
            ivs: ivsObject,
            // Ya no enviamos stats calculadas - se calcularán en el frontend
            ability: abilityId, // ID de la habilidad para la BD
            item: itemId, // ID del item para la BD
            moves: moveIds, // Array de IDs de movimientos
            slot: index + 1, // Slot basado en la posición (1-6 en lugar de 0-5)
          };
        }),
      };

      console.log(`💾 ${teamId ? "Updating" : "Creating"} team:`, JSON.stringify(teamData, null, 2));

      let response;

      // Si tenemos teamId, actualizar el equipo existente, si no, crear uno nuevo
      if (teamId) {
        response = await apiService.updateTeam(teamId, teamData);
        console.log("📤 Update team response:", response);
      } else {
        response = await apiService.createTeam(teamData);
        console.log("📤 Create team response:", response);
      }

      if (!response.success) {
        throw new Error(response.message || "Failed to save team");
      }

      console.log("✅ Team saved successfully");
      navigate("/teams"); // Redirigir a la lista de equipos
    } catch (err) {
      console.error("❌ Error saving team:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button className="save-team-button" onClick={openModal} disabled={pokemons.every((p) => !p.name)}>
        {teamId ? "Update Team" : "Save Team"}
      </button>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClick}>
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>
              <IoClose />
            </button>

            <div className="modal-team-info">
              <h2>{teamId ? "Update Team" : "Save Team"}</h2>

              <div className="team-name-section">
                {isEditingName ? (
                  <div className="username-edit">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="username-input"
                      placeholder="Enter team name"
                      disabled={saving}
                      autoFocus
                    />
                    <div className="username-actions">
                      <button onClick={saveTeamName} disabled={saving} className="save-button" title="Save">
                        <FaCheck />
                      </button>
                      <button onClick={cancelEditingName} disabled={saving} className="cancel-button" title="Cancel">
                        <IoClose />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="team-name-display">
                    <h4>{teamName || "Unnamed Team"}</h4>
                    <button onClick={startEditingName} className="edit-button" title="Edit team name">
                      <RiEditLine />
                    </button>
                  </div>
                )}
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="modal-actions">
                <button onClick={handleSave} disabled={saving || !teamName.trim()} className="confirm-button">
                  {saving ? "Saving..." : teamId ? "Update" : "Save"}
                </button>
                <button onClick={closeModal} disabled={saving} className="cancel-button-main">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveTeamButton;
