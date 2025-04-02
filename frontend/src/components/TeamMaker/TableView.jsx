import React, { memo, useMemo } from "react";
import PokemonTable from "./PokemonTable";
import MoveTable from "./MoveTable";
import { usePokemonData } from "../../PokemonDataContext";

// TableView component that handles which table to display
const TableView = memo(
  ({
    viewMode,
    selectedSlot,
    selectedPokemon,
    selectedMove,
    onPokemonSelect,
    onMoveSelect,
  }) => {
    const { isAllDataLoaded } = usePokemonData();

    // Show appropriate table based on viewMode
    const renderTable = useMemo(() => {
      if (viewMode === "pokemon") {
        return <PokemonTable onPokemonSelect={onPokemonSelect} />;
      }

      if (viewMode === "moves" && selectedPokemon?.name) {
        return (
          <MoveTable
            onMoveSelect={(move) =>
              onMoveSelect(move, selectedSlot, selectedMove.moveIndex)
            }
            selectedPokemon={selectedPokemon}
            selectedSlot={selectedSlot}
            selectedMoveIndex={selectedMove.moveIndex}
          />
        );
      }

      return null;
    }, [
      viewMode,
      selectedPokemon?.id,
      selectedSlot,
      selectedMove.moveIndex,
      onPokemonSelect,
      onMoveSelect,
    ]);

    return renderTable;
  },
  (prevProps, nextProps) => {
    // Rerender on view mode, slot, or selected move changes
    if (prevProps.viewMode !== nextProps.viewMode) return false;
    if (prevProps.selectedSlot !== nextProps.selectedSlot) return false;
    if (prevProps.selectedMove.moveIndex !== nextProps.selectedMove.moveIndex)
      return false;

    if (
      prevProps.viewMode === "moves" &&
      prevProps.selectedPokemon?.id !== nextProps.selectedPokemon?.id
    ) {
      return false;
    }

    return true;
  }
);

export default TableView;
