import React, { memo } from "react";
import MoveSet from "./MoveSet";
import ItemAbility from "./ItemAbility";
import PokeInfo from "./PokeInfo";
import Stats from "./Stats";
import "./TeamMaker.css";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";
import { useTeam } from "../../TeamContext";

// Componente para mostrar un slot del equipo
const PokeSlot = memo(
  ({ pokemon, isSelected, index }) => {
    const { selectSlot } = useTeam();

    const handleSelect = () => {
      selectSlot(index);
    };

    // Definimos un estilo condicional para el borde
    const slotStyle = {
      border: `2px solid ${pokemon.name ? (isSelected ? "#007bff" : "transparent") : "#a0a0a0"}`,
    };

    return (
      <div
        className={`pokemonTeamCard flex ${isSelected ? "selected-slot" : ""}`}
        onClick={handleSelect}
        style={slotStyle}
      >
        <div className="pokemonImageContainer">
          <Tippy
            content={pokemon.name || `Pokémon ${index + 1}`}
            animation="scale"
            delay={[300, 100]}
            placement="top"
            offset={[0, -25]}
          >
            <img src={`/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`} alt={pokemon.name} />
          </Tippy>
        </div>
        <div className="pokemonDataContainer">
          <PokeInfo name={pokemon.name} level={pokemon.level} types={pokemon.types} index={index} />
          <ItemAbility
            pokemon={pokemon}
            item={pokemon.item}
            ability={pokemon.ability}
            abilityType={pokemon.abilityType}
            itemSpriteNum={pokemon.itemSpriteNum}
            slotIndex={index}
          />
          <hr id="separatorLine" />
          <MoveSet pokemon={pokemon} moves={pokemon.moveset} slotIndex={index} />
        </div>
        <Stats pokemon={pokemon} index={index} />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.isSelected === nextProps.isSelected && prevProps.pokemon === nextProps.pokemon;
  }
);

export default PokeSlot;
