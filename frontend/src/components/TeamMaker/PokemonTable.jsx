import React, { useState, useCallback, memo, useMemo, useEffect } from "react";
import PokemonRow from "./PokemonRow";
import { usePokemonData } from "../../PokemonDataContext";
import { useTeam } from "../../TeamContext";

const PokemonTable = memo(({ onPokemonSelect }) => {
  const { getPokemons, pokemons, pokemonsLoaded, pokemonsLoading, pokemonsError } = usePokemonData();
  const { pokemons: teamPokemons } = useTeam(); // Accedemos a los Pokémon del equipo
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const tableRef = React.useRef(null);
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

  // Scroll handling with requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (!tableRef.current) return;

    requestAnimationFrame(() => {
      const { scrollTop, clientHeight, scrollHeight } = tableRef.current;
      const rowHeight = 50;

      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 20);
      const visibleRows = Math.ceil(clientHeight / rowHeight) + 40;
      const end = Math.min(filteredPokemon.length, start + visibleRows);

      setVisibleRange({ start, end });
    });
  }, [filteredPokemon.length]);

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
  if (pokemonsLoading || isProcessingData) {
    return <p>⏳ Loading Pokémon data...</p>;
  }

  if (pokemonsError) {
    return <p>❌ Error: {pokemonsError}</p>;
  }

  // Only show visible rows
  const visiblePokemon = filteredPokemon.slice(visibleRange.start, visibleRange.end);

  return (
    <div>
      <h2>Pokémon List</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name, type, ability..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      <div ref={tableRef} className="table-container" style={{ height: "300px", overflow: "auto" }}>
        <table border="1" className="pokemon-table">
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
            {/* Height container for proper scrollbar */}
            <tr style={{ height: `${visibleRange.start * 50}px`, padding: 0 }}>
              <td colSpan="11" style={{ padding: 0 }}></td>
            </tr>

            {visiblePokemon.length > 0 ? (
              visiblePokemon.map((pokemon) => (
                <PokemonRow key={pokemon.id || pokemon.name} pokemon={pokemon} onClick={handleRowClick} />
              ))
            ) : (
              <tr>
                <td colSpan="11">❌ No Pokémon found</td>
              </tr>
            )}

            <tr
              style={{
                height: `${(filteredPokemon.length - visibleRange.end) * 50}px`,
                padding: 0,
              }}
            >
              <td colSpan="11" style={{ padding: 0 }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default PokemonTable;
