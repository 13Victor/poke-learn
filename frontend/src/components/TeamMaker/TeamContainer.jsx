import React from "react";
import PokeSlot from "./PokeSlot";
import { useTeam } from "../../TeamContext";

const TeamContainer = ({ team, handleSlotClick }) => {
  const { selectedSlot } = useTeam();

  return (
    <div className="teamContainer">
      {team.map((pokemon, index) => (
        <PokeSlot
          key={index}
          index={index} // 👈 Pasar `index`
          pokemon={pokemon}
          isSelected={selectedSlot === index}
          onSelect={() => handleSlotClick(index)}
        />
      ))}
    </div>
  );
};

export default TeamContainer;
