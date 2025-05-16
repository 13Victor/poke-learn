import React, { memo } from "react";
import MoveSet from "./MoveSet";
import ItemAbility from "./ItemAbility";
import PokeInfo from "./PokeInfo";
import Stats from "./Stats";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/scale.css";
import { useTeam } from "../../contexts/TeamContext";
import { useHighlight } from "./TeamAnalysis"; // Import the highlight context
import TypeBackgroundPokeball from "./TypeBackgroundPokeball";

// Componente para mostrar un slot del equipo
const PokeSlot = memo(
  ({ pokemon, isSelected, index }) => {
    const { selectSlot } = useTeam();
    const { highlightedPokemonIds } = useHighlight();

    const isHighlighted = highlightedPokemonIds.includes(index);
    const shouldApplyGrayscale = highlightedPokemonIds.length > 0 && !isHighlighted;

    const handleSelect = () => {
      selectSlot(index);
    };

    // Style for applying grayscale filter
    const grayscaleStyle = shouldApplyGrayscale
      ? { filter: "grayscale(1)", opacity: "0.75", transition: "all var(--transition-normal)" }
      : { transition: "none" };

    // Enhanced style for highlighted Pokémon
    const highlightStyle = isHighlighted
      ? {
          transition: "all var(--transition-normal)",
        }
      : {};

    console.log("PokeSlot", pokemon);

    return (
      <div
        className={`pokemonTeamCard ${isSelected ? "selected-slot" : ""}`}
        onClick={handleSelect}
        style={{
          ...grayscaleStyle,
          ...highlightStyle,
        }}
      >
        <div className="pokemonImageContainer">
          <Tippy
            content={pokemon.name || `Pokémon ${index + 1}`}
            animation="scale"
            delay={[300, 100]}
            placement="top"
            offset={[0, -15]}
          >
            <div className="pokemon-image-wrapper">
              <TypeBackgroundPokeball types={pokemon.types} />

              {/* The Pokémon image */}
              <img src={`/assets/pokemon-small-hd-sprites-webp/${pokemon.image}`} alt={pokemon.name} />
            </div>
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
    // We intentionally don't compare highlight state here since we want
    // to re-render when highlight state changes
    return prevProps.isSelected === nextProps.isSelected && prevProps.pokemon === nextProps.pokemon;
  }
);

export default PokeSlot;
