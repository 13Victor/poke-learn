import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";

import MoveRow from "./MoveRow";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import { useTeam } from "../../contexts/TeamContext";
import "../../styles/MoveTable.css";

// Definir altura de filas constante para todo el componente
const ROW_HEIGHT = 40;

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
  const [searchTerm, setSearchTerm] = useState(""); // Added search term state

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

  // Obtener todos los movimientos asignados al Pokémon actual, no solo en el índice que se está editando
  const assignedMoves = useMemo(() => {
    if (!selectedPokemon || selectedSlot === undefined) return new Set();

    // Obtenemos los movimientos asignados al Pokémon en el slot seleccionado
    const pokemonInTeam = pokemons[selectedSlot];
    if (!pokemonInTeam || !pokemonInTeam.moveset) return new Set();

    // Crear un Set con TODOS los movimientos ya asignados (incluyendo strings y objetos)
    return new Set(
      pokemonInTeam.moveset
        .filter((move) => move) // Filtramos solo los movimientos que existen (no vacíos)
        .map((move) => {
          // Si es un objeto, extraemos el nombre, si es un string lo usamos directamente
          return typeof move === "object" ? move.name : move;
        })
    );
  }, [pokemons, selectedSlot, selectedPokemon]);

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
      setSearchTerm(""); // Reset search when pokemon changes
    }
  }, [selectedPokemon?.id]);

  // Handle search functionality
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setVisibleRange({ start: 0, end: 50 });

    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, []);

  // Filter moves based on search term
  const filteredMoves = useMemo(() => {
    if (!searchTerm) return pokemonMoves;

    return pokemonMoves.filter(
      (move) =>
        move.name.toLowerCase().includes(searchTerm) ||
        move.type.toLowerCase().includes(searchTerm) ||
        move.category?.toLowerCase().includes(searchTerm) ||
        (move.shortDesc && move.shortDesc.toLowerCase().includes(searchTerm)) ||
        (move.desc && move.desc.toLowerCase().includes(searchTerm))
    );
  }, [pokemonMoves, searchTerm]);

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
      const { scrollTop, clientHeight } = tableRef.current;
      const rowHeight = ROW_HEIGHT;

      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 15);
      const visibleRows = Math.ceil(clientHeight / rowHeight) + 30;
      const end = Math.min(filteredMoves.length, start + visibleRows);

      setVisibleRange({ start, end });
    });
  }, [filteredMoves.length]);

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
  const visibleMoves = filteredMoves.slice(visibleRange.start, visibleRange.end);

  return (
    <div className="table-container move-table">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search moves by name, type, or description..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div ref={tableRef} className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Power</th>
              <th>Accuracy</th>
              <th>PP</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {visibleRange.start > 0 && (
              <tr className="spacer-row" style={{ height: `${visibleRange.start * ROW_HEIGHT}px` }}>
                <td colSpan="8"></td>
              </tr>
            )}

            {visibleMoves.length > 0 ? (
              visibleMoves.map((move, index) => (
                <MoveRow
                  key={move.name}
                  move={move}
                  onClick={handleRowClick}
                  isEven={(visibleRange.start + index) % 2 === 0}
                />
              ))
            ) : (
              <tr>
                <td colSpan="8">❌ No moves available</td>
              </tr>
            )}

            {filteredMoves.length > visibleRange.end && (
              <tr
                className="spacer-row"
                style={{ height: `${(filteredMoves.length - visibleRange.end) * ROW_HEIGHT}px` }}
              >
                <td colSpan="8"></td>
              </tr>
            )}
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
