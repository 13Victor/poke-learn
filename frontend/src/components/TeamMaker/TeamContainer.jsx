import React from "react";
import PokeSlot from "./PokeSlot";
import { useTeam } from "../../TeamContext";

const TeamContainer = ({ team, handleSlotClick }) => {
  const { selectedSlot } = useTeam(); // 👈 Obtener `selectedSlot` desde el contexto

  {
    team.map((pokemon, index) =>
      console.log(
        "🔹 Pokémon en el slot",
        index,
        ":",
        pokemon.name,
        "con moveset",
        pokemon.moveset
      )
    );
  }

  return (
    <div className="teamContainer">
      {team.map((pokemon, index) => (
        <PokeSlot
          key={index}
          pokemon={pokemon}
          isSelected={selectedSlot === index}
          onSelect={() => handleSlotClick(index)}
        />
      ))}
    </div>
  );
};

export default TeamContainer;
