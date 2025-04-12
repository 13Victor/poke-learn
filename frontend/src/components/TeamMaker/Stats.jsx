import React from "react";
import Stat from "./Stat";
import { useTeam } from "../../contexts/TeamContext";

const Stats = ({ pokemon, index }) => {
  const { setViewMode, selectedSlot, setSelectedSlot, setFlowStage, FLOW_STAGES, flowStage, viewMode } = useTeam();

  // Determinar si los stats están seleccionados actualmente
  const isStatsSelected = flowStage === FLOW_STAGES.STATS && selectedSlot === index && viewMode === "stats";

  // Calculamos las stats base si no hay stats guardadas
  const calculateBaseStats = () => {
    if (!pokemon?.baseStats) return null;

    const level = pokemon.level || 100;
    return {
      hp: Math.floor(((2 * pokemon.baseStats.hp + 31) * level) / 100) + level + 10,
      atk: Math.floor(((2 * pokemon.baseStats.atk + 31) * level) / 100) + 5,
      def: Math.floor(((2 * pokemon.baseStats.def + 31) * level) / 100) + 5,
      spa: Math.floor(((2 * pokemon.baseStats.spa + 31) * level) / 100) + 5,
      spd: Math.floor(((2 * pokemon.baseStats.spd + 31) * level) / 100) + 5,
      spe: Math.floor(((2 * pokemon.baseStats.spe + 31) * level) / 100) + 5,
    };
  };

  // Get stats from pokemon - use calculated stats if available, otherwise calculate base stats
  const stats = pokemon?.stats ||
    calculateBaseStats() || {
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
      setFlowStage(FLOW_STAGES.STATS);
    }
  };

  // Podemos establecer valores máximos basados en las estadísticas base más altas de los Pokémon
  // Estos valores pueden ajustarse según el game balance
  const maxValues = {
    hp: 600,
    atk: 600,
    def: 600,
    spa: 600,
    spd: 600,
    spe: 600,
  };

  return (
    <div
      className={`pokemonStatsContainer ${isStatsSelected ? "stats-selected" : ""}`}
      onClick={handleStatsClick}
      style={{ cursor: "pointer" }}
    >
      <Stat
        label="HP"
        value={stats.hp}
        baseValue={pokemon?.baseStats?.hp}
        maxValue={maxValues.hp}
        isStatsSelected={isStatsSelected}
      />
      <Stat
        label="Speed"
        value={stats.spe}
        baseValue={pokemon?.baseStats?.spe}
        maxValue={maxValues.spe}
        isStatsSelected={isStatsSelected}
      />
      <Stat
        label="Atk"
        value={stats.atk}
        baseValue={pokemon?.baseStats?.atk}
        maxValue={maxValues.atk}
        isStatsSelected={isStatsSelected}
      />
      <Stat
        label="Sp. Atk"
        value={stats.spa}
        baseValue={pokemon?.baseStats?.spa}
        maxValue={maxValues.spa}
        isStatsSelected={isStatsSelected}
      />
      <Stat
        label="Def"
        value={stats.def}
        baseValue={pokemon?.baseStats?.def}
        maxValue={maxValues.def}
        isStatsSelected={isStatsSelected}
      />
      <Stat
        label="Sp. Def"
        value={stats.spd}
        baseValue={pokemon?.baseStats?.spd}
        maxValue={maxValues.spd}
        isStatsSelected={isStatsSelected}
      />
    </div>
  );
};

export default Stats;
