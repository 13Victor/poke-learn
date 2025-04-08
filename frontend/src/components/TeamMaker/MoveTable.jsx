import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";

import MoveRow from "./MoveRow";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import { useTeam } from "../../contexts/TeamContext";

const MoveTable = ({ onMoveSelect, selectedPokemon, selectedSlot, selectedMoveIndex }) => {
  const {
    getMoves,
    getLearnsets,
    moves,
    learnsets,
    movesLoaded,
    movesLoading,
    movesError,
    learnsetsLoaded,
    learnsetsLoading,
    learnsetsError,
  } = usePokemonData();
  const { pokemons } = useTeam(); // Accedemos a los pokemons del equipo para filtrar movimientos ya usados
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const tableRef = useRef(null);
  const [pokemonMoves, setPokemonMoves] = useState([]);
  const [isProcessingMoves, setIsProcessingMoves] = useState(false);

  // Load necessary data if not already loaded
  useEffect(() => {
    const loadRequiredData = async () => {
      // Only load if we have a selected Pokémon and data isn't already loading
      if (!selectedPokemon) return;

      // Load moves and learnsets in parallel if needed
      const promises = [];

      if (!movesLoaded && !movesLoading) {
        promises.push(getMoves());
      }

      if (!learnsetsLoaded && !learnsetsLoading) {
        promises.push(getLearnsets());
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    loadRequiredData();
  }, [selectedPokemon, movesLoaded, movesLoading, learnsetsLoaded, learnsetsLoading, getMoves, getLearnsets]);

  // Obtener los movimientos que ya están asignados al Pokémon actual
  const assignedMoves = useMemo(() => {
    if (!selectedPokemon || selectedSlot === undefined) return new Set();

    // Obtenemos los movimientos asignados al Pokémon en el slot seleccionado
    const pokemonInTeam = pokemons[selectedSlot];
    if (!pokemonInTeam || !pokemonInTeam.moveset) return new Set();

    // Crear un Set con los movimientos ya asignados (excepto el que se está editando actualmente)
    return new Set(pokemonInTeam.moveset.filter((move, index) => move && index !== selectedMoveIndex));
  }, [pokemons, selectedSlot, selectedMoveIndex, selectedPokemon]);

  // Process move data when we have all required data
  useEffect(() => {
    const processMoveData = () => {
      if (!selectedPokemon || !selectedPokemon.id || !movesLoaded || !learnsetsLoaded || isProcessingMoves) {
        return;
      }

      setIsProcessingMoves(true);

      try {
        const pokemonLearnset =
          learnsets[selectedPokemon.id]?.learnset || learnsets[selectedPokemon.changesFrom]?.learnset || {};

        const moveNames = Object.keys(pokemonLearnset);
        const availableMoves = moveNames
          .map((move) => moves[move])
          .filter(Boolean)
          // Filtramos para excluir los movimientos ya asignados
          .filter((move) => !assignedMoves.has(move.name));

        setPokemonMoves(availableMoves);
        console.log(
          `✅ ${availableMoves.length} moves processed for ${selectedPokemon.name} (after filtering assigned moves)`
        );
      } catch (error) {
        console.error(`❌ Error processing moves:`, error);
      } finally {
        setIsProcessingMoves(false);
      }
    };

    processMoveData();
  }, [selectedPokemon, moves, learnsets, movesLoaded, learnsetsLoaded, isProcessingMoves, assignedMoves]);

  // Reset scroll position when Pokémon changes
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
      setVisibleRange({ start: 0, end: 50 });
    }
  }, [selectedPokemon?.id]);

  // Handle row click with explicit slot and move index tracking
  const handleRowClick = useCallback(
    (move) => {
      onMoveSelect(move);
    },
    [onMoveSelect]
  );

  // Optimized scroll handler
  const handleScroll = useCallback(() => {
    if (!tableRef.current) return;

    requestAnimationFrame(() => {
      const { scrollTop, clientHeight, scrollHeight } = tableRef.current;
      const rowHeight = 40;

      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 15);
      const visibleRows = Math.ceil(clientHeight / rowHeight) + 30;
      const end = Math.min(pokemonMoves.length, start + visibleRows);

      setVisibleRange({ start, end });
    });
  }, [pokemonMoves.length]);

  // Set up scroll listener
  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      let scrollTimeout;

      const optimizedScrollHandler = () => {
        if (!scrollTimeout) {
          scrollTimeout = setTimeout(() => {
            handleScroll();
            scrollTimeout = null;
          }, 16);
        }
      };

      tableElement.addEventListener("scroll", optimizedScrollHandler, {
        passive: true,
      });
      return () => tableElement.removeEventListener("scroll", optimizedScrollHandler);
    }
  }, [handleScroll]);

  // Show appropriate loading state
  if (movesLoading || learnsetsLoading || isProcessingMoves) {
    return <p>⏳ Loading move data...</p>;
  }

  if (movesError || learnsetsError) {
    return <p>❌ Error: {movesError || learnsetsError}</p>;
  }

  // Only show visible rows
  const visibleMoves = pokemonMoves.slice(visibleRange.start, visibleRange.end);

  return (
    <div>
      <h2>
        Available moves for {selectedPokemon?.name || "???"} (Slot {selectedSlot + 1}, Move {selectedMoveIndex + 1})
      </h2>

      <div ref={tableRef} className="table-container">
        <table border="1" className="pokemon-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Power</th>
              <th>Accuracy</th>
              <th>PP</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: `${visibleRange.start * 40}px`, padding: 0 }}>
              <td colSpan="6" style={{ padding: 0 }}></td>
            </tr>

            {visibleMoves.length > 0 ? (
              visibleMoves.map((move) => <MoveRow key={move.name} move={move} onClick={handleRowClick} />)
            ) : (
              <tr>
                <td colSpan="6">❌ No moves available</td>
              </tr>
            )}
            <tr
              style={{
                height: `${(pokemonMoves.length - visibleRange.end) * 40}px`,
                padding: 0,
              }}
            >
              <td colSpan="6" style={{ padding: 0 }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary rerenders
export default React.memo(MoveTable, (prevProps, nextProps) => {
  return (
    prevProps.selectedPokemon?.id === nextProps.selectedPokemon?.id &&
    prevProps.selectedSlot === nextProps.selectedSlot &&
    prevProps.selectedMoveIndex === nextProps.selectedMoveIndex
  );
});
