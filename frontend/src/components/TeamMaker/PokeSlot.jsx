import React from "react";
import TeamMakerMoveSet from "./MoveSet";
import TeamMakerItemAbility from "./ItemAbility";
import TeamMakerPokeInfo from "./PokeInfo";
import "./TeamMaker.css";

const PokeSlot = ({ pokemon, index }) => {
  if (!pokemon) {
    return <div className="pokemonTeamCard flex emptySlot">Empty Slot</div>;
  }

  return (
    <div className="pokemonTeamCard flex">
      <div className="pokemonImageContainer">
        <img src={`/assets/pokemon-hd/${pokemon.image}`} alt={pokemon.name} />
      </div>
      <div className="pokemonDataContainer">
        <TeamMakerPokeInfo
          name={pokemon.name}
          level={pokemon.level}
          types={pokemon.types}
        />
        <TeamMakerItemAbility item="" ability="" onChange={() => {}} />
        <hr id="separatorLine" />
        <TeamMakerMoveSet
          moves={{ Move1: "", Move2: "", Move3: "", Move4: "" }}
          onChange={() => {}}
        />
      </div>
      <div className="statsContainer"></div>
    </div>
  );
};

export default PokeSlot;
