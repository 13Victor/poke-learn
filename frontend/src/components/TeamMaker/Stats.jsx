import React from "react";
import "./Stats.css";

const Stats = ({ pokemon }) => {
  // Si no hay estadísticas disponibles o no hay pokémon seleccionado, mostrar valores por defecto
  const stats = pokemon?.stats || {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };

  return (
    <div className="pokemonStatsContainer">
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
