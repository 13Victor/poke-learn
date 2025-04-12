import React, { useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { useNavigate } from "react-router-dom";
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
      const response = await fetch("http://localhost:5000/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: teamName,
          pokemon: pokemons.map((pokemon) => ({
            pokemon_name: pokemon.name,
            pokemon_id: pokemon.id,
            level: pokemon.level,
            image: pokemon.image,
            nature: pokemon.nature,
            evs: pokemon.evs,
            ivs: pokemon.ivs,
            stats: pokemon.stats,
            ability: pokemon.ability,
            abilityType: pokemon.abilityType,
            item: pokemon.item,
            moves: pokemon.moveset,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save team");

      navigate("/teams");
    } catch (err) {
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
