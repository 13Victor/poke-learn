import React from "react";
import Stat from "./Stat";
import { useTeam } from "../../contexts/TeamContext";
import { calculateBaseDisplayStats } from "../../utils/pokemonStatsCalculator";

const Stats = ({ pokemon, index }) => {
  const { setViewMode, selectedSlot, setSelectedSlot, setFlowStage, FLOW_STAGES, flowStage, viewMode } = useTeam();

  // Determinar si los stats están seleccionados actualmente
  const isStatsSelected = flowStage === FLOW_STAGES.STATS && selectedSlot === index && viewMode === "stats";

  // Obtener stats - usar las calculadas si existen, sino calcular las base
  const stats = pokemon?.stats ||
    calculateBaseDisplayStats(pokemon?.baseStats, pokemon?.level) || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

  const handleStatsClick = (e) => {
    e.stopPropagation();
    setSelectedSlot(index);

    if (!pokemon.name) {
      setViewMode("pokemon");
      setFlowStage(FLOW_STAGES.POKEMON);
    } else {
      setViewMode("stats");
      setFlowStage(FLOW_STAGES.STATS);
    }
  };

  const maxValues = {
    hp: 600,
    atk: 600,
    def: 600,
    spa: 600,
    spd: 600,
    spe: 600,
  };

  return (
    <div className="pokemonStatsContainerWrapper">
      <hr id="separatorLine" />
      <div
        className={`pokemonStatsContainer ${isStatsSelected ? "stats-selected" : ""}`}
        onClick={handleStatsClick}
        style={{ cursor: "pointer" }}
      >
        <Stat
          label="HP"
          fullname="Hit Points"
          value={stats.hp}
          baseValue={pokemon?.baseStats?.hp}
          maxValue={maxValues.hp}
          isStatsSelected={isStatsSelected}
        />
        <Stat
          label="Atk"
          fullname="Attack"
          value={stats.atk}
          baseValue={pokemon?.baseStats?.atk}
          maxValue={maxValues.atk}
          isStatsSelected={isStatsSelected}
        />
        <Stat
          label="Def"
          fullname="Defense"
          value={stats.def}
          baseValue={pokemon?.baseStats?.def}
          maxValue={maxValues.def}
          isStatsSelected={isStatsSelected}
        />
        <Stat
          label="SpA"
          fullname="Special Attack"
          value={stats.spa}
          baseValue={pokemon?.baseStats?.spa}
          maxValue={maxValues.spa}
          isStatsSelected={isStatsSelected}
        />
        <Stat
          label="Spd"
          fullname="Special Defense"
          value={stats.spd}
          baseValue={pokemon?.baseStats?.spd}
          maxValue={maxValues.spd}
          isStatsSelected={isStatsSelected}
        />
        <Stat
          label="Spe"
          fullname="Speed"
          value={stats.spe}
          baseValue={pokemon?.baseStats?.spe}
          maxValue={maxValues.spe}
          isStatsSelected={isStatsSelected}
        />
      </div>
    </div>
  );
};

export default Stats;
