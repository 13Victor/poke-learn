import React, { memo } from "react";
import PokeSlot from "./PokeSlot";
import { useTeam } from "../../contexts/TeamContext";

// Componente wrapper que solo se renderiza cuando cambia el estado de selección
const SlotWrapper = memo(
  ({ index, pokemon, isSelected }) => {
    return <PokeSlot index={index} pokemon={pokemon} isSelected={isSelected} />;
  },
  (prevProps, nextProps) => {
    // Solo re-renderizar si cambia la selección o los datos del pokemon
    if (prevProps.isSelected !== nextProps.isSelected) return false;

    // Comparación superficial para detectar cambios en el objeto pokemon
    const prevPokemon = prevProps.pokemon;
    const nextPokemon = nextProps.pokemon;

    if (prevPokemon.name !== nextPokemon.name) return false;
    if (prevPokemon.level !== nextPokemon.level) return false;
    if (prevPokemon.item !== nextPokemon.item) return false;
    if (prevPokemon.ability !== nextPokemon.ability) return false;
    if (prevPokemon.image !== nextPokemon.image) return false;

    // Comparar moveset
    if (prevPokemon.moveset && nextPokemon.moveset) {
      for (let i = 0; i < prevPokemon.moveset.length; i++) {
        if (prevPokemon.moveset[i] !== nextPokemon.moveset[i]) return false;
      }
    }

    // Comparar types
    if (prevPokemon.types && nextPokemon.types) {
      if (prevPokemon.types.length !== nextPokemon.types.length) return false;
      for (let i = 0; i < prevPokemon.types.length; i++) {
        if (prevPokemon.types[i] !== nextPokemon.types[i]) return false;
      }
    }

    return true;
  }
);

const TeamContainer = memo(() => {
  const { pokemons, selectedSlot } = useTeam();

  return (
    <div className="teamContainer">
      {pokemons.map((pokemon, index) => (
        <SlotWrapper key={index} index={index} pokemon={pokemon} isSelected={selectedSlot === index} />
      ))}
    </div>
  );
});

export default TeamContainer;
