import React, { memo } from "react";
import PokeSlot from "./PokeSlot";
import { useTeam } from "../../TeamContext";

const TeamContainer = memo(() => {
  const { pokemons, selectedSlot } = useTeam();

  return (
    <div className="teamContainer">
      {pokemons.map((pokemon, index) => (
        <PokeSlot
          key={index}
          index={index}
          pokemon={pokemon}
          isSelected={selectedSlot === index}
        />
      ))}
    </div>
  );
});

export default TeamContainer;
