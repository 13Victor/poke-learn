import React from "react";
import "./Stats.css";
import { useTeam } from "../../TeamContext";

const Stats = ({ pokemon, index }) => {
  const { setViewMode, selectedSlot, setSelectedSlot, setFlowStage, FLOW_STAGES } = useTeam();

  // Get stats from pokemon - use calculated stats if available, otherwise baseStats
  const stats = pokemon?.stats ||
    pokemon?.baseStats || {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    };

  const handleStatsClick = (e) => {
    // Prevent event propagation
    e.stopPropagation();

    // Set the selected slot
    setSelectedSlot(index);

    // If no Pokémon is selected, show Pokémon selection view
    if (!pokemon.name) {
      setViewMode("pokemon");
      setFlowStage(FLOW_STAGES.POKEMON);
    } else {
      // If Pokémon exists, go to stats view
      setViewMode("stats");
      setFlowStage(FLOW_STAGES.STATS); // We'll add this to FLOW_STAGES
    }
  };

  return (
    <div
      className="pokemonStatsContainer"
      onClick={handleStatsClick}
      style={{ cursor: "pointer" }} // Always show pointer cursor
    >
      <div className="hpContainer">
        <p>HP</p>
        <p>{stats.hp}</p>
      </div>
      <div className="speedContainer">
        <p>Speed</p>
        <p>{stats.spe}</p>
      </div>
      <div className="attackContainer">
        <p>Atk</p>
        <p>{stats.atk}</p>
      </div>
      <div className="specialAttackContainer">
        <p>Sp. Atk</p>
        <p>{stats.spa}</p>
      </div>
      <div className="defenseContainer">
        <p>Def</p>
        <p>{stats.def}</p>
      </div>
      <div className="specialDefenseContainer">
        <p>Sp. Def</p>
        <p>{stats.spd}</p>
      </div>
    </div>
  );
};

export default Stats;
