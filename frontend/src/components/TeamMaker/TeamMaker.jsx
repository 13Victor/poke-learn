import React, { useState } from "react";
import TeamContainer from "./TeamContainer";
import PokemonTable from "./PokemonTable";
import MoveTable from "./MoveTable";
import { useViewMode } from "../../ViewModeContext";
import { useTeam } from "../../TeamContext";

const TeamMaker = () => {
  const { viewMode, setViewMode, selectedMove, setSelectedMove } =
    useViewMode(); // Destructura `selectedMove` y `setSelectedMove` aquí
  const { selectedSlot, setSelectedSlot } = useTeam();

  const [team, setTeam] = useState([
    {
      name: "",
      level: 0,
      item: "",
      ability: "",
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "",
      level: 0,
      item: "",
      ability: "",
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "",
      level: 0,
      item: "",
      ability: "",
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "",
      level: 0,
      item: "",
      ability: "",
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "",
      level: 0,
      item: "",
      ability: "",
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
    {
      name: "",
      level: 0,
      item: "",
      ability: "",
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    },
  ]);

  console.log("Equipo inicial:", team); // Verifica el equipo inicial

  const handleSlotClick = (index) => {
    console.log("🎯 Slot seleccionado:", index);
    setSelectedSlot(index);

    // 🔄 Resetear el foco del movimiento al primer movimiento del nuevo slot
    setSelectedMove({ slot: index, moveIndex: 0 });

    setViewMode("pokemon");
  };

  const handlePokemonSelect = (pokemon) => {
    if (
      selectedSlot !== null &&
      selectedSlot >= 0 &&
      selectedSlot < team.length
    ) {
      // Copiar el Pokémon actual y preservar su moveset
      const updatedTeam = [...team];
      updatedTeam[selectedSlot] = {
        ...pokemon,
        moveset: team[selectedSlot].moveset || ["", "", "", ""], // Asegurarse de que el moveset no se pierda
      };

      console.log(updatedTeam[selectedSlot].moveset); // Verifica que moveset se conserva correctamente

      setTeam(updatedTeam);
      setSelectedMove({ slot: selectedSlot, moveIndex: 0 }); // ✅ Seleccionar automáticamente el primer movimiento
      setViewMode("moves"); // ✅ Cambiar a la vista de movimientos
    }
  };

  const handleMoveSelect = (move) => {
    if (
      selectedSlot !== null &&
      selectedSlot >= 0 &&
      selectedSlot < team.length
    ) {
      const updatedTeam = [...team];
      const updatedPokemon = updatedTeam[selectedSlot];

      // Añadir el movimiento en el `selectedMove.moveIndex`
      updatedPokemon.moveset[selectedMove.moveIndex] = move.name; // Colocamos el movimiento en la posición correcta

      updatedTeam[selectedSlot] = updatedPokemon; // Reemplazamos el Pokémon actualizado
      setTeam(updatedTeam); // Actualizamos el equipo con el nuevo movimiento

      // Aumentamos el `moveIndex` para que el siguiente movimiento se coloque en el siguiente espacio
      const nextMoveIndex = selectedMove.moveIndex + 1;

      // Si el `moveIndex` es menor que 4 (porque hay 4 movimientos), actualizamos el estado para el siguiente movimiento
      if (nextMoveIndex < 4) {
        setSelectedMove({ slot: selectedSlot, moveIndex: nextMoveIndex });
      } else {
        // Si ya se alcanzó el máximo (4 movimientos), no hacemos nada
        console.log("Ya se han asignado todos los movimientos.");
      }
    }
  };

  return (
    <>
      <TeamContainer team={team} handleSlotClick={handleSlotClick} />
      {viewMode === "pokemon" && (
        <PokemonTable onPokemonSelect={handlePokemonSelect} />
      )}
      {viewMode === "moves" && (
        <MoveTable
          onMoveSelect={handleMoveSelect}
          moves={team[selectedSlot].moveset}
          slotIndex={selectedSlot}
          selectedPokemon={team[selectedSlot]}
        />
      )}
    </>
  );
};

export default TeamMaker;
