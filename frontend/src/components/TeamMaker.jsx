import React, { useState } from "react";
import "./TeamMaker.css";
import Pokemon from "../../src/pokemon-hd/0034.png";

const TeamMaker = () => {
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
        <img src={Pokemon} alt="Pokemon" />
      </div>
      <div className="pokemonDataContainer">
        <div className="mainInfoContainer flex">
          <span className="name-levelContainer flex">
            <p>Nidoking</p>
            <span className="pokemonCurrentLevel flex-center">
              <strong>Lv.</strong>
              <p>100</p>
            </span>
          </span>
          <span className="pokemonTypeing flex-center">
            <img
              className="small-icon"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pok%C3%A9mon_Ground_Type_Icon.svg/1200px-Pok%C3%A9mon_Ground_Type_Icon.svg.png"
              alt="Ground Type"
            />
            <img
              className="small-icon"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Pok%C3%A9mon_Poison_Type_Icon.svg/2048px-Pok%C3%A9mon_Poison_Type_Icon.svg.png"
              alt="Poison Type"
            />
          </span>
        </div>

        <div className="item-abilityContainer">
          <div className="itemContainer">
            <img
              className="small-icon"
              src="https://images.wikidexcdn.net/mwuploads/wikidex/b/be/latest/20230122140856/Banda_aguante_EP.png"
              alt="Item"
            />
            <input
              type="text"
              name="item"
              value={teamData.item}
              onChange={handleChange}
            />
          </div>
          <input
            type="text"
            name="ability"
            className="abilityInput"
            value={teamData.ability}
            onChange={handleChange}
          />
        </div>

        <hr id="separatorLine" />

        <div className="moveInputsContainer">
          {Object.keys(teamData.moves).map((move, index) => (
            <input
              key={index}
              type="text"
              className="moveInput"
              name={move}
              value={teamData.moves[move]}
              onChange={handleChange}
            />
          ))}
        </div>
      </div>
      <div className="statsContainer"></div>
    </div>
  );
};

export default TeamMaker;
