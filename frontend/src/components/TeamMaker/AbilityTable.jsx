import React, { useMemo } from "react";
import { usePokemonData } from "../../PokemonDataContext";
import AbilityRow from "./AbilityRow";

const AbilityTable = ({ onAbilitySelect, selectedPokemon, selectedSlot }) => {
  const { abilities, abilitiesLoaded, abilitiesLoading, abilitiesError } = usePokemonData();

  // Extract abilities for the selected Pokémon
  const pokemonAbilities = useMemo(() => {
    if (!abilitiesLoaded || !selectedPokemon?.id) return null;
    return abilities[selectedPokemon.id]?.abilities || null;
  }, [abilities, abilitiesLoaded, selectedPokemon?.id]);

  // Handle ability selection
  const handleRowClick = (ability, abilityType) => {
    onAbilitySelect(ability[0], abilityType);
  };

  if (abilitiesLoading) {
    return <p>⏳ Loading ability data...</p>;
  }

  if (abilitiesError) {
    return <p>❌ Error: {abilitiesError}</p>;
  }

  if (!pokemonAbilities) {
    return <p>No abilities found for this Pokémon.</p>;
  }

  return (
    <div>
      <h2>
        Select an ability for {selectedPokemon?.name || "???"} (Slot {selectedSlot + 1})
      </h2>

      <div className="table-container">
        <table border="1" className="pokemon-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(pokemonAbilities).map(([abilityType, ability]) => (
              <AbilityRow key={abilityType} ability={ability} abilityType={abilityType} onClick={handleRowClick} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(AbilityTable, (prevProps, nextProps) => {
  return (
    prevProps.selectedSlot === nextProps.selectedSlot && prevProps.selectedPokemon?.id === nextProps.selectedPokemon?.id
  );
});
