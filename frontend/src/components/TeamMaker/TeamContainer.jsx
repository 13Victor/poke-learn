import React from "react";
import PokeSlot from "./PokeSlot";

const TeamContainer = ({ team, selectedSlot, handleSlotClick }) => {
  return (
    <div className="teamContainer">
      {team.map((pokemon, index) => (
        <PokeSlot
          key={index}
          pokemon={pokemon}
          index={index}
          isSelected={selectedSlot === index}
          onSelect={() => handleSlotClick(index)}
        />
      ))}
    </div>
  );
};

export default TeamContainer;
