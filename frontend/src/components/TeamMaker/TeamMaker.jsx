import React, { memo, useMemo } from "react";
import TeamContainer from "./TeamContainer";
import TableView from "./TableView";
import { useTeam } from "../../TeamContext";
import { usePokemonData } from "../../PokemonDataContext";

// Loading indicator component
const LoadingIndicator = memo(({ label }) => (
  <div className="loading-indicator">
    <div className="spinner"></div>
    <p>⏳ Loading {label}...</p>
  </div>
));

// Main TeamMaker component
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

  console.log("🔴 Rendering TeamMaker component");

  const { isAllDataLoaded, isLoading } = usePokemonData();

  // Handle Pokémon selection
  const handlePokemonSelect = React.useCallback(
    (pokemon) => {
      console.log("🔹 Selecting Pokémon:", pokemon.name);
      selectPokemon(selectedSlot, pokemon);
    },
    [selectPokemon, selectedSlot]
  );

  // Handle move selection with explicit slot tracking
  const handleMoveSelect = React.useCallback(
    (move, slotIndex, moveIndex) => {
      console.log(
        `🔹 Selecting move "${move.name}" for slot ${slotIndex}, move position ${moveIndex}`
      );

      // Use the explicit slot and move index passed from the table
      setMove(slotIndex, moveIndex, move.name);

      // Calculate next move index and update selection
      const nextMoveIndex = (moveIndex + 1) % 4;
      setSelectedMove({
        slot: slotIndex,
        moveIndex: nextMoveIndex,
      });
    },
    [setMove, setSelectedMove]
  );

  // Get currently selected Pokémon
  const selectedPokemon = useMemo(() => {
    return selectedSlot !== null ? pokemons[selectedSlot] : null;
  }, [pokemons, selectedSlot]);

  return (
    <>
      <TeamContainer />

      {isLoading && !isAllDataLoaded ? (
        <LoadingIndicator label="data" />
      ) : (
        <TableView
          viewMode={viewMode}
          selectedSlot={selectedSlot}
          selectedPokemon={selectedPokemon}
          selectedMove={selectedMove}
          onPokemonSelect={handlePokemonSelect}
          onMoveSelect={handleMoveSelect}
        />
      )}
    </>
  );
});

export default TeamMaker;
