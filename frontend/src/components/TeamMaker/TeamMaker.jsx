import React, { memo } from "react";
import TeamContainer from "./TeamContainer";
import PokemonTable from "./PokemonTable";
import MoveTable from "./MoveTable";
import { useTeam } from "../../TeamContext";

const TeamMaker = memo(() => {
  const {
    viewMode,
    selectedSlot,
    pokemons,
    selectPokemon,
    setMove,
    selectedMove,
    setSelectedMove,
  } = useTeam();

  const moveIndexRef = React.useRef(0);

  React.useEffect(() => {
    moveIndexRef.current = selectedMove.moveIndex;
  }, [selectedMove]);

  const handlePokemonSelect = (pokemon) => {
    selectPokemon(selectedSlot, pokemon);
  };

  const handleMoveSelect = (move) => {
    if (selectedSlot !== null) {
      // Usar el valor de la ref para el índice actual
      const currentMoveIndex = moveIndexRef.current;

      // Establecer el movimiento actual
      setMove(selectedSlot, currentMoveIndex, move.name);

      // Calcular y actualizar el siguiente índice
      const nextMoveIndex = currentMoveIndex + 1;
      console.log("Moviendo de índice", currentMoveIndex, "a", nextMoveIndex);

      if (nextMoveIndex < 4) {
        // Actualizar la ref inmediatamente
        moveIndexRef.current = nextMoveIndex;

        // Y también actualizar el state para la UI
        setSelectedMove({
          slot: selectedSlot,
          moveIndex: nextMoveIndex,
        });
      }
    }
  };

  // Solo renderizar el componente que está activo
  const renderActiveComponent = () => {
    if (viewMode === "pokemon") {
      return <PokemonTable onPokemonSelect={handlePokemonSelect} />;
    }

    if (viewMode === "moves") {
      return (
        <MoveTable
          onMoveSelect={handleMoveSelect}
          selectedPokemon={pokemons[selectedSlot]}
        />
      );
    }

    return null;
  };

  return (
    <>
      <TeamContainer />
      {renderActiveComponent()}
    </>
  );
});

export default TeamMaker;
