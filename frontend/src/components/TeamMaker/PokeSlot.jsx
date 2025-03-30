import React from "react";
import MoveSet from "./MoveSet";
import ItemAbility from "./ItemAbility";
import PokeInfo from "./PokeInfo";
import "./TeamMaker.css";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Estilos básicos
import "tippy.js/animations/scale.css"; // Animación opcional

const PokeSlot = ({ pokemon, isSelected, onSelect }) => {
  return (
    <div
      className={`pokemonTeamCard flex ${isSelected ? "selected-slot" : ""}`}
      onClick={onSelect}
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
        <PokeInfo
          name={pokemon.name}
          level={pokemon.level}
          types={pokemon.types}
        />
        <ItemAbility item="" ability="" onChange={() => {}} />
        <hr id="separatorLine" />
        <MoveSet moves={pokemon.moveset} />
      </div>
    </div>
  );
};

export default PokeSlot;
