// TableView.jsx actualizado
import React, { memo, useMemo, useCallback } from "react";
import PokemonTable from "./PokemonTable";
import MoveTable from "./MoveTable";
import ItemTable from "./ItemTable"; // Importar ItemTable
import { usePokemonData } from "../../PokemonDataContext";
import { useTeam } from "../../TeamContext";

const TableView = memo(() => {
  const { isAllDataLoaded } = usePokemonData();
  const {
    viewMode,
    selectedSlot,
    pokemons,
    selectPokemon,
    setMove,
    selectedMove,
    setSelectedMove,
    selectItem, // Asegurar que se importe esta función
  } = useTeam();

  // Get currently selected Pokémon
  const selectedPokemon = useMemo(() => {
    return selectedSlot !== null ? pokemons[selectedSlot] : null;
  }, [pokemons, selectedSlot]);

  // Handle Pokémon selection
  const handlePokemonSelect = useCallback(
    (pokemon) => {
      console.log("🔹 Selecting Pokémon:", pokemon.name);
      selectPokemon(selectedSlot, pokemon);
    },
    [selectPokemon, selectedSlot]
  );

  // Handle move selection with explicit slot tracking
  const handleMoveSelect = useCallback(
    (move) => {
      const slotIndex = selectedSlot;
      const moveIndex = selectedMove.moveIndex;

      console.log(
        `🔹 Selecting move "${move.name}" for slot ${slotIndex}, move position ${moveIndex}`
      );

      // Use the explicit slot and move index
      setMove(slotIndex, moveIndex, move.name);

      // Calculate next move index and update selection
      const nextMoveIndex = (moveIndex + 1) % 4;
      setSelectedMove({
        slot: slotIndex,
        moveIndex: nextMoveIndex,
      });
    },
    [selectedSlot, selectedMove.moveIndex, setMove, setSelectedMove]
  );

  // Handle item selection
  const handleItemSelect = useCallback(
    (item) => {
      console.log(`🔹 Selecting item "${item.name}" for slot ${selectedSlot}`);
      selectItem(item);
    },
    [selectItem, selectedSlot]
  );

  // Show appropriate table based on viewMode
  if (viewMode === "pokemon") {
    return <PokemonTable onPokemonSelect={handlePokemonSelect} />;
  }

  if (viewMode === "moves" && selectedPokemon?.name) {
    return (
      <MoveTable
        onMoveSelect={handleMoveSelect}
        selectedPokemon={selectedPokemon}
        selectedSlot={selectedSlot}
        selectedMoveIndex={selectedMove.moveIndex}
      />
    );
  }

  if (viewMode === "items") {
    return (
      <ItemTable
        onItemSelect={handleItemSelect}
        selectedPokemon={selectedPokemon}
        selectedSlot={selectedSlot}
      />
    );
  }

  return null;
});

export default TableView;
