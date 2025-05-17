import React, { useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/apiService";
import "../../styles/Teams.css"; // Adjust the path as necessary

const SaveTeamButton = () => {
  const { pokemons } = useTeam();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Preparar datos del equipo
      const teamData = {
        name: teamName,
        pokemon: pokemons.map((pokemon, index) => ({
          pokemon_name: pokemon.name,
          pokemon_id: pokemon.id,
          level: pokemon.level,
          image: pokemon.image,
          nature: pokemon.nature,
          evs: {
            hp: pokemon.evs?.hp || 0,
            atk: pokemon.evs?.atk || 0,
            def: pokemon.evs?.def || 0,
            spa: pokemon.evs?.spa || 0, // Nota: en la BD es spatk
            spd: pokemon.evs?.spd || 0, // Nota: en la BD es spdef
            spe: pokemon.evs?.spe || 0, // Nota: en la BD es speed
          },
          ivs: {
            hp: pokemon.ivs?.hp || 31,
            atk: pokemon.ivs?.atk || 31,
            def: pokemon.ivs?.def || 31,
            spa: pokemon.ivs?.spa || 31,
            spd: pokemon.ivs?.spd || 31,
            spe: pokemon.ivs?.spe || 31,
          },
          stats: pokemon.stats || {},
          ability: pokemon.abilityId, // Ahora usamos el ID de la habilidad
          item: pokemon.itemId, // Usamos el ID del item
          moves: pokemon.moveset.filter((move) => move).map((move) => (typeof move === "object" ? move.id : move)), // Filtramos movimientos vacíos y extraemos IDs
          slot: index + 1,
        })),
      };

      console.log("Team data to save:", teamData);

      // Usar nuestro servicio API para crear el equipo
      const response = await apiService.createTeam(teamData);

      if (!response.success) {
        throw new Error(response.message || "Failed to save team");
      }

      navigate("/teams");
    } catch (err) {
      console.error("Error saving team:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        className="save-team-button"
        onClick={() => setIsModalOpen(true)}
        disabled={pokemons.every((p) => !p.name)}
      >
        Save Team
      </button>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Save Team</h2>
            <input
              type="text"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            {error && <p className="error">{error}</p>}
            <div className="modal-actions">
              <button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setIsModalOpen(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveTeamButton;
