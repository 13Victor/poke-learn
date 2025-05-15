import React, { memo, useMemo, useCallback } from "react";
import PokemonTable from "./PokemonTable";
import MoveTable from "./MoveTable";
import ItemTable from "./ItemTable";
import AbilityTable from "./AbilityTable";
import StatsTable from "./StatsTable";
import { useTeam } from "../../contexts/TeamContext";

import "../../styles/Tables.css";

const TableView = memo(() => {
  const { viewMode, selectedSlot, pokemons, selectPokemon, selectMove, selectedMove, selectItem, selectAbility } =
    useTeam();

  // Get currently selected Pokémon
  const selectedPokemon = useMemo(() => {
    return selectedSlot !== null ? pokemons[selectedSlot] : null;
  }, [pokemons, selectedSlot]);

  // Handle Pokémon selection
  const handlePokemonSelect = useCallback(
    (pokemon) => {
      console.log("🔹 Selecting Pokémon:", pokemon.name);
      selectPokemon(pokemon);
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

  // Handle ability selection
  const handleAbilitySelect = useCallback(
    (ability, abilityType) => {
      console.log(`🔹 Selecting ability "${ability}" (${abilityType}) for slot ${selectedSlot}`);
      selectAbility(ability, abilityType);
    },
    [selectAbility, selectedSlot]
  );

  // Determinar qué tabla mostrar basado en el viewMode
  const renderTable = () => {
    switch (viewMode) {
      case "pokemon":
        return <PokemonTable onPokemonSelect={handlePokemonSelect} key="pokemon-table" />;
      case "moves":
        if (!selectedPokemon?.name) return null;
        return (
          <MoveTable
            onMoveSelect={handleMoveSelect}
            selectedPokemon={selectedPokemon}
            selectedSlot={selectedSlot}
            selectedMoveIndex={selectedMove.moveIndex}
            key="move-table"
          />
        );
      case "items":
        return (
          <ItemTable
            onItemSelect={handleItemSelect}
            selectedPokemon={selectedPokemon}
            selectedSlot={selectedSlot}
            key="item-table"
          />
        );
      case "abilities":
        return (
          <AbilityTable
            onAbilitySelect={handleAbilitySelect}
            selectedPokemon={selectedPokemon}
            selectedSlot={selectedSlot}
            key="ability-table"
          />
        );
      case "stats":
        if (!selectedPokemon?.name) return null;
        return <StatsTable selectedPokemon={selectedPokemon} selectedSlot={selectedSlot} key="stats-table" />;
      default:
        return null;
    }
  };

  return renderTable();
});

export default TableView;
