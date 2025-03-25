import React, { useState } from "react";
import TeamMakerMoveSet from "./MoveSet";
import TeamMakerItemAbility from "./ItemAbility";
import TeamMakerPokeInfo from "./PokeInfo";
import "./TeamMaker.css";

const PokeSlot = ({ pokemon, index }) => {
  const [teamData, setTeamData] = useState({
    item: "",
    ability: "",
    moves: {
      Move1: "",
      Move2: "",
      Move3: "",
      Move4: "",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setTeamData((prevData) => ({
      ...prevData,
      moves:
        name in prevData.moves
          ? { ...prevData.moves, [name]: value }
          : prevData.moves,
      [name]: name in prevData.moves ? prevData[name] : value,
    }));
  };

  return (
    <div className="pokemonTeamCard flex">
      <div className="pokemonImageContainer">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <div className="pokemonDataContainer">
        <TeamMakerPokeInfo
          name={pokemon.name}
          level={pokemon.level}
          types={pokemon.types}
        />
        <TeamMakerItemAbility
          item={teamData.item}
          ability={teamData.ability}
          onChange={handleChange}
        />
        <hr id="separatorLine" />
        <TeamMakerMoveSet moves={teamData.moves} onChange={handleChange} />
      </div>
      <div className="statsContainer"></div>
    </div>
  );
};

export default PokeSlot;
