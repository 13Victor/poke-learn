import React, { memo, useMemo, useCallback } from "react";
import PokemonTable from "./PokemonTable";
import MoveTable from "./MoveTable";
import ItemTable from "./ItemTable";
import { usePokemonData } from "../../PokemonDataContext";
import { useTeam } from "../../TeamContext";

const TableView = memo(() => {
  const { isAllDataLoaded } = usePokemonData();
  const {
    viewMode,
    selectedSlot,
    pokemons,
    selectPokemon,
    selectMove,
    selectedMove,
    selectItem,
    FLOW_STAGES,
    flowStage,
  } = useTeam();

  // Get currently selected Pokémon
  const selectedPokemon = useMemo(() => {
    return selectedSlot !== null ? pokemons[selectedSlot] : null;
  }, [pokemons, selectedSlot]);

  // Handle Pokémon selection - esto limpiará los datos gracias a la modificación en el reducer
  const handlePokemonSelect = useCallback(
    (pokemon) => {
      console.log("🔹 Selecting Pokémon:", pokemon.name);
      selectPokemon(selectedSlot, pokemon);
    },
    [selectPokemon, selectedSlot]
  );

  // Handle move selection
  const handleMoveSelect = useCallback(
    (move) => {
      console.log(`🔹 Selecting move "${move.name}" for slot ${selectedSlot}, move position ${selectedMove.moveIndex}`);
      selectMove(move);
    },
    [selectedSlot, selectedMove.moveIndex, selectMove]
  );

  // Handle item selection
  const handleItemSelect = useCallback(
    (item) => {
      console.log(`🔹 Selecting item "${item.name}" for slot ${selectedSlot}`);
      selectItem(item);
    },
    [selectItem, selectedSlot]
  );

  // Determinar qué tabla mostrar basado en el viewMode
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
    return <ItemTable onItemSelect={handleItemSelect} selectedPokemon={selectedPokemon} selectedSlot={selectedSlot} />;
  }

  return null;
});

export default TableView;
