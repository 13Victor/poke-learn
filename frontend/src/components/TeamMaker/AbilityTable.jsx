import React, { useMemo } from "react";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import AbilityRow from "./AbilityRow";

const AbilityTable = ({ onAbilitySelect, selectedPokemon, selectedSlot }) => {
  const { abilities, abilitiesLoaded, abilitiesLoading, abilitiesError } = usePokemonData();

  // Extract abilities for the selected Pokémon
  const pokemonAbilities = useMemo(() => {
    if (!abilitiesLoaded || !selectedPokemon?.id) return null;
    return abilities[selectedPokemon.id]?.abilities || null;
  }, [abilities, abilitiesLoaded, selectedPokemon?.id]);

  // Handle ability selection - Ahora recibimos también el ID
  const handleRowClick = (abilityName, abilityId, abilityType) => {
    onAbilitySelect(abilityName, abilityId, abilityType);
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
    <div className="table-container ability-table">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(pokemonAbilities).map(([abilityType, ability], index) => (
              <AbilityRow
                key={abilityType}
                ability={ability}
                abilityType={abilityType}
                onClick={handleRowClick}
                isEven={index % 2 === 0}
              />
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
