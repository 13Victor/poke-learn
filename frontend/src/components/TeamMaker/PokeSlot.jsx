import React from "react";
import TeamMakerMoveSet from "./MoveSet";
import TeamMakerItemAbility from "./ItemAbility";
import TeamMakerPokeInfo from "./PokeInfo";
import "./TeamMaker.css";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Estilos básicos
import "tippy.js/animations/scale.css"; // Animación opcional

const PokeSlot = ({ pokemon, index, isSelected, onSelect }) => {
  return (
    <div
      className={`pokemonTeamCard flex ${isSelected ? "selected-slot" : ""}`}
      onClick={onSelect} // Cambia el slot seleccionado al hacer clic
    >
      <div className="pokemonImageContainer">
        <Tippy
          content={pokemon.name}
          animation="scale"
          delay={[300, 100]}
          placement="top"
          offset={[0, -25]}
        >
          <img
            src={`/assets/pokemon-small-hd-sprites/${pokemon.image}`}
            alt={pokemon.name}
          />
        </Tippy>
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
    </div>
  );
};

export default PokeSlot;
