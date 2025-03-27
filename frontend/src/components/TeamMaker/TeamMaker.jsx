// TeamMaker.jsx
import React, { useState } from "react";
import TeamContainer from "./TeamContainer";
import "./TeamMaker.css";
import PokemonTable from "./PokemonTable";

const TeamMaker = () => {
  const [team, setTeam] = useState([
    { name: "Pokemon 1", level: 0, image: "0000.png", types: [] },
    { name: "Pokemon 2", level: 0, image: "0000.png", types: [] },
    { name: "Pokemon 3", level: 0, image: "0000.png", types: [] },
    { name: "Pokemon 4", level: 0, image: "0000.png", types: [] },
    { name: "Pokemon 5", level: 0, image: "0000.png", types: [] },
    { name: "Pokemon 6", level: 0, image: "0000.png", types: [] },
  ]);

  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleSlotClick = (index) => {
    console.log("🎯 Slot seleccionado:", index);
    setSelectedSlot(index);
  };

  const handlePokemonSelect = (pokemon) => {
    if (selectedSlot === null) return;

    console.log(`🔄 Reemplazando slot ${selectedSlot} con:`, pokemon);

    setTeam((prevTeam) => {
      const newTeam = [...prevTeam];
      newTeam[selectedSlot] = {
        ...pokemon,
        image: pokemon.image || "default.png", // Asegurar que siempre haya una imagen válida
      };
      return newTeam;
    });
  };

  console.log("👾 Equipo actual:", team);

  return (
    <>
      <TeamContainer
        team={team}
        selectedSlot={selectedSlot}
        handleSlotClick={handleSlotClick}
      />
      <PokemonTable onPokemonSelect={handlePokemonSelect} />
    </>
  );
};

export default TeamMaker;
