import React from "react";
import Stat from "./Stat";
import "./Stats.css";
import { useTeam } from "../../TeamContext";

const Stats = ({ pokemon, index }) => {
  const { setViewMode, selectedSlot, setSelectedSlot, setFlowStage, FLOW_STAGES } = useTeam();

  // Get stats from pokemon - use calculated stats if available, otherwise baseStats
  const stats = pokemon?.stats
    ? pokemon.stats
    : pokemon?.baseStats
    ? {
        hp: calculateHP(pokemon.baseStats.hp, pokemon.level || 100),
        atk: calculateStat(pokemon.baseStats.atk, pokemon.level || 100),
        def: calculateStat(pokemon.baseStats.def, pokemon.level || 100),
        spa: calculateStat(pokemon.baseStats.spa, pokemon.level || 100),
        spd: calculateStat(pokemon.baseStats.spd, pokemon.level || 100),
        spe: calculateStat(pokemon.baseStats.spe, pokemon.level || 100),
      }
    : {
        hp: 0,
        atk: 0,
        def: 0,
        spa: 0,
        spd: 0,
        spe: 0,
      };

  // Simple function to calculate HP stat from base stat and level
  function calculateHP(baseStat, level) {
    if (!baseStat) return 0;
    // Formula for HP: ((2 * Base + 31 + (0/4)) * Level / 100) + Level + 10
    // Assuming 31 IVs, 0 EVs, neutral nature for simplicity
    return Math.floor(((2 * baseStat + 31) * level) / 100) + level + 10;
  }

  // Simple function to calculate other stats from base stat and level
  function calculateStat(baseStat, level) {
    if (!baseStat) return 0;
    // Formula for other stats: ((2 * Base + 31 + (0/4)) * Level / 100) + 5
    // Assuming 31 IVs, 0 EVs, neutral nature for simplicity
    return Math.floor(((2 * baseStat + 31) * level) / 100) + 5;
  }

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
    <div className="pokemonStatsContainer" onClick={handleStatsClick} style={{ cursor: "pointer" }}>
      <Stat label="HP" value={stats.hp} baseValue={pokemon?.baseStats?.hp} maxValue={maxValues.hp} />
      <Stat label="Speed" value={stats.spe} baseValue={pokemon?.baseStats?.spe} maxValue={maxValues.spe} />
      <Stat label="Atk" value={stats.atk} baseValue={pokemon?.baseStats?.atk} maxValue={maxValues.atk} />
      <Stat label="Sp.Atk" value={stats.spa} baseValue={pokemon?.baseStats?.spa} maxValue={maxValues.spa} />
      <Stat label="Def" value={stats.def} baseValue={pokemon?.baseStats?.def} maxValue={maxValues.def} />
      <Stat label="Sp.Def" value={stats.spd} baseValue={pokemon?.baseStats?.spd} maxValue={maxValues.spd} />
    </div>
  );
};

export default Stats;
