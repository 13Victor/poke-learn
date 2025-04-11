import React, { useState, useCallback, memo, useMemo, useEffect, useRef } from "react";
import PokemonRow from "./PokemonRow";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import { useTeam } from "../../contexts/TeamContext";

// Definir altura de filas constante para todo el componente
const ROW_HEIGHT = 38;

const PokemonTable = memo(({ onPokemonSelect }) => {
  const { getPokemons, pokemons, pokemonsLoaded, pokemonsLoading, pokemonsError } = usePokemonData();
  const { pokemons: teamPokemons } = useTeam();
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const tableRef = useRef(null);
  const scrollRAF = useRef(null);
  const [processedData, setProcessedData] = useState([]);
  const [isProcessingData, setIsProcessingData] = useState(false);

  // Load pokemon data if not already loaded
  useEffect(() => {
    const loadData = async () => {
      if (!pokemonsLoaded && !pokemonsLoading) {
        await getPokemons();
      }
    };

    loadData();
  }, [pokemonsLoaded, pokemonsLoading, getPokemons]);

  // Process data only when pokemons change and not during initial loading
  useEffect(() => {
    if (pokemonsLoaded && pokemons.length > 0 && !isProcessingData) {
      setIsProcessingData(true);

      // Use setTimeout to prevent UI blocking during processing
      setTimeout(() => {
        const processedData = pokemons.map((pokemon) => ({
          ...pokemon,
          typesString: pokemon.types.join(", "),
          abilitiesString: pokemon.abilities.join(", "),
        }));

        setProcessedData(processedData);
        setIsProcessingData(false);
        console.log("✅ Pokémon table data processed");
      }, 0);
    }
  }, [pokemons, pokemonsLoaded, isProcessingData]);

  // Search functionality
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setVisibleRange({ start: 0, end: 50 });

    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, []);

  // Crear un conjunto con los nombres de los Pokémon ya en el equipo
  const teamPokemonNames = useMemo(() => {
    return new Set(teamPokemons.filter((p) => p.name).map((p) => p.name));
  }, [teamPokemons]);

  // Filter Pokémon based on search term and exclude those already in team
  const filteredPokemon = useMemo(() => {
    if (!processedData.length) return [];

    return processedData.filter(
      (pokemon) =>
        // Filtrar por término de búsqueda
        (pokemon.name.toLowerCase().includes(searchTerm) ||
          pokemon.typesString.toLowerCase().includes(searchTerm) ||
          pokemon.abilitiesString.toLowerCase().includes(searchTerm)) &&
        // Excluir Pokémon que ya están en el equipo
        !teamPokemonNames.has(pokemon.name)
    );
  }, [processedData, searchTerm, teamPokemonNames]);

  // Row click handler
  const handleRowClick = useCallback(
    (pokemon) => {
      console.log("🔹 Selected Pokémon:", pokemon);
      onPokemonSelect(pokemon);
    },
    [onPokemonSelect]
  );

  // Optimized scroll handling with debounce
  const handleScroll = useCallback(() => {
    if (!tableRef.current) return;

    // Cancel any existing RAF
    if (scrollRAF.current) {
      cancelAnimationFrame(scrollRAF.current);
    }

    scrollRAF.current = requestAnimationFrame(() => {
      const { scrollTop, clientHeight } = tableRef.current;

      const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 20);
      const visibleRows = Math.ceil(clientHeight / ROW_HEIGHT) + 40;
      const end = Math.min(filteredPokemon.length, start + visibleRows);

      // Solo actualizamos si realmente hay un cambio
      if (visibleRange.start !== start || visibleRange.end !== end) {
        setVisibleRange({ start, end });
      }

      scrollRAF.current = null;
    });
  }, [filteredPokemon.length, visibleRange]);

  // Set up scroll listener
  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        tableElement.removeEventListener("scroll", handleScroll);
        if (scrollRAF.current) {
          cancelAnimationFrame(scrollRAF.current);
        }
      };
    }
  }, [handleScroll]);

  // Show appropriate loading state
  if (pokemonsLoading || isProcessingData) {
    return <p>⏳ Loading Pokémon data...</p>;
  }

  if (pokemonsError) {
    return <p>❌ Error: {pokemonsError}</p>;
  }

  // Only show visible rows
  const visiblePokemon = filteredPokemon.slice(visibleRange.start, visibleRange.end);

  return (
    <div className="table-container pokemon-table">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name, type, ability..."
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
              <th>Tier</th>
              <th>Types</th>
              <th>Abilities</th>
              <th>HP</th>
              <th>ATK</th>
              <th>DEF</th>
              <th>SPA</th>
              <th>SPD</th>
              <th>SPE</th>
            </tr>
          </thead>
          <tbody>
            {visibleRange.start > 0 && (
              <tr className="spacer-row" style={{ height: `${visibleRange.start * ROW_HEIGHT}px` }}>
                <td colSpan="11"></td>
              </tr>
            )}

            {visiblePokemon.length > 0 ? (
              visiblePokemon.map((pokemon, index) => (
                <PokemonRow
                  key={pokemon.id || pokemon.name}
                  pokemon={pokemon}
                  onClick={handleRowClick}
                  isEven={(visibleRange.start + index) % 2 === 0}
                />
              ))
            ) : (
              <tr>
                <td colSpan="11">❌ No Pokémon found</td>
              </tr>
            )}

            {filteredPokemon.length > visibleRange.end && (
              <tr
                className="spacer-row"
                style={{ height: `${(filteredPokemon.length - visibleRange.end) * ROW_HEIGHT}px` }}
              >
                <td colSpan="11"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

PokemonTable.displayName = "PokemonTable";

export default PokemonTable;
