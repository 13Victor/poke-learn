import React, { useCallback, useMemo } from "react";
import MoveRow from "./MoveRow";
import { usePokemonData } from "../../PokemonDataContext";

const MoveTable = ({ onMoveSelect, selectedPokemon }) => {
  const { moves, learnsets, loading, error } = usePokemonData();

  // Memoizar la lista de movimientos filtrados para evitar recálculos innecesarios
  const filteredMoves = useMemo(() => {
    if (
      !selectedPokemon ||
      !selectedPokemon.id ||
      Object.keys(learnsets).length === 0
    ) {
      return [];
    }

    const pokemonLearnset =
      learnsets[selectedPokemon.id]?.learnset ||
      learnsets[selectedPokemon.changesFrom]?.learnset ||
      {};

    const moveNames = Object.keys(pokemonLearnset);
    return moveNames.map((move) => moves[move]).filter(Boolean);
  }, [selectedPokemon, learnsets, moves]);

  // Memoizar el handler para evitar recreaciones
  const handleRowClick = useCallback(
    (move) => {
      onMoveSelect(move);
    },
    [onMoveSelect]
  );

  if (loading) return <p>⏳ Cargando Movimientos...</p>;
  if (error) return <p>❌ Error: {error}</p>;

  return (
    <div>
      <h2>Movimientos disponibles para {selectedPokemon?.name || "???"}</h2>

      <div className="table-container">
        <table border="1" className="pokemon-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Poder</th>
              <th>Precisión</th>
              <th>PP</th>
            </tr>
          </thead>
          <tbody>
            {filteredMoves.length > 0 ? (
              filteredMoves.map((move) => (
                <MoveRow key={move.name} move={move} onClick={handleRowClick} />
              ))
            ) : (
              <tr>
                <td colSpan="6">❌ No hay movimientos disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Memoizar el componente completo
export default React.memo(MoveTable, (prevProps, nextProps) => {
  // Solo renderizar si cambia el Pokémon seleccionado
  return prevProps.selectedPokemon?.id === nextProps.selectedPokemon?.id;
});
