import React, { useState } from "react";
import TeamContainer from "./TeamContainer";
import PokemonTable from "./PokemonTable";
import MoveTable from "./MoveTable";
import { useViewMode } from "../../ViewModeContext";
import { TeamProvider, useTeam } from "../../TeamContext";

const TeamMaker = () => {
  const { viewMode, setViewMode } = useViewMode();
  const { selectedSlot, setSelectedSlot } = useTeam();

  const [team, setTeam] = useState([
    {
      name: "Pokemon 1",
      level: 0,
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "Pokemon 2",
      level: 0,
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "Pokemon 3",
      level: 0,
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "Pokemon 4",
      level: 0,
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "Pokemon 5",
      level: 0,
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "Pokemon 6",
      level: 0,
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
  ]);

  const handleSlotClick = (index) => {
    console.log("🎯 Slot seleccionado:", index);
    setSelectedSlot(index);
    setViewMode("pokemon");
  };

  const handlePokemonSelect = (pokemon) => {
    if (
      selectedSlot !== null &&
      selectedSlot >= 0 &&
      selectedSlot < team.length
    ) {
      const updatedTeam = [...team];
      updatedTeam[selectedSlot] = { ...pokemon, moveset: ["", "", "", ""] }; // 🔥 Asegurar que el moveset esté presente
      setTeam(updatedTeam);
    }
    setViewMode("moves"); // Cambiar a la vista de movimientos
  };

  const handleMoveSelect = (move) => {
    if (
      selectedSlot !== null &&
      selectedSlot >= 0 &&
      selectedSlot < team.length
    ) {
      const updatedTeam = [...team];
      const updatedPokemon = updatedTeam[selectedSlot];
      updatedPokemon.moveset = updatedPokemon.moveset.map((m, idx) =>
        idx === selectedSlot ? move.name : m
      );
      updatedTeam[selectedSlot] = updatedPokemon;
      setTeam(updatedTeam); // Actualizar el equipo con el nuevo movimiento
    }
  };

  return (
    <>
      <TeamContainer team={team} handleSlotClick={handleSlotClick} />
      {viewMode === "pokemon" && (
        <PokemonTable onPokemonSelect={handlePokemonSelect} />
      )}
      {viewMode === "moves" && <MoveTable onMoveSelect={handleMoveSelect} />}
    </>
  );
};

export default TeamMaker;
