import React, { useState, useCallback, memo, useMemo, useEffect, useRef } from "react";
import PokemonRow from "./PokemonRow";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import { useTeam } from "../../contexts/TeamContext";

// Definir altura de filas constante para todo el componente
const ROW_HEIGHT = 42.5;

// Define tier order for custom sorting
const TIER_ORDER = {
  OU: 1,
  UU: 3,
  UUBL: 2,
  RUBL: 4,
  RU: 5,
  NUBL: 6,
  NU: 7,
  PUBL: 8,
  PU: 9,
  ZUBL: 10,
  ZU: 11,
  NFE: 12,
  LC: 13,
};

const PokemonTable = memo(({ onPokemonSelect }) => {
  const { getPokemons, pokemons, pokemonsLoaded, pokemonsLoading, pokemonsError } = usePokemonData();
  const { pokemons: teamPokemons } = useTeam();
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const tableRef = useRef(null);
  const scrollRAF = useRef(null);
  const [processedData, setProcessedData] = useState([]);
  const [isProcessingData, setIsProcessingData] = useState(false);
  const processedRef = useRef(false); // Nuevo ref para rastrear si los datos han sido procesados
  const [sortConfig, setSortConfig] = useState({ key: "tier", direction: "ascending" }); // Default sort by tier ascending

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
    // Solo procesamos los datos si no se han procesado antes o si los datos de Pokémon han cambiado
    if (
      pokemonsLoaded &&
      pokemons.length > 0 &&
      !isProcessingData &&
      (!processedRef.current || processedData.length === 0 || processedData[0]?.id !== pokemons[0]?.id)
    ) {
      setIsProcessingData(true);
      processedRef.current = true; // Marcamos que los datos están siendo procesados

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
  }, [pokemons, pokemonsLoaded, isProcessingData, processedData]);

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

  // Sort function
  const sortData = useCallback((data, config) => {
    if (!config.key) return data;

    return [...data].sort((a, b) => {
      if (config.key === "name") {
        return config.direction === "ascending" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }

      if (config.key === "tier") {
        const tierA = TIER_ORDER[a.tier] || 999;
        const tierB = TIER_ORDER[b.tier] || 999;

        // If tiers are the same, sort by name as secondary criterion
        if (tierA === tierB) {
          return config.direction === "ascending" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }

        return config.direction === "ascending" ? tierA - tierB : tierB - tierA;
      }

      if (config.key === "types") {
        return config.direction === "ascending"
          ? a.types[0].localeCompare(b.types[0])
          : b.types[0].localeCompare(a.types[0]);
      }

      if (config.key === "abilities") {
        return config.direction === "ascending"
          ? a.abilities[0].localeCompare(b.abilities[0])
          : b.abilities[0].localeCompare(a.abilities[0]);
      }

      if (config.key.startsWith("baseStats.")) {
        const stat = config.key.split(".")[1];
        return config.direction === "ascending"
          ? a.baseStats[stat] - b.baseStats[stat]
          : b.baseStats[stat] - a.baseStats[stat];
      }

      return 0;
    });
  }, []);

  // Handle column header click for sorting
  const handleSort = useCallback((key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === "ascending" ? "descending" : "ascending",
        };
      }
      return { key, direction: "ascending" };
    });

    // Reset scroll position when sorting changes
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
    setVisibleRange({ start: 0, end: 50 });
  }, []);

  // Filter Pokémon based on search term and exclude those already in team
  const filteredPokemon = useMemo(() => {
    if (!processedData.length) return [];

    const filtered = processedData.filter(
      (pokemon) =>
        // Filtrar por término de búsqueda
        (pokemon.name.toLowerCase().includes(searchTerm) ||
          pokemon.typesString.toLowerCase().includes(searchTerm) ||
          pokemon.abilitiesString.toLowerCase().includes(searchTerm)) &&
        // Excluir Pokémon que ya están en el equipo
        !teamPokemonNames.has(pokemon.name)
    );

    // Apply sorting
    return sortData(filtered, sortConfig);
  }, [processedData, searchTerm, teamPokemonNames, sortConfig, sortData]);

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

  // Check if we have processed data
  if (processedData.length === 0) {
    return <p>No Pokémon data available</p>;
  }

  // Only show visible rows
  const visiblePokemon = filteredPokemon.slice(visibleRange.start, visibleRange.end);

  // Function to render sort indicator
  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return null; // Don't show any indicator for unsorted columns
    }
    return sortConfig.direction === "ascending" ? (
      <i className="fa-solid fa-sort-up"></i>
    ) : (
      <i className="fa-solid fa-sort-down"></i>
    );
  };

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
              <th onClick={() => handleSort("name")} className="sortable-header">
                Name {renderSortIndicator("name")}
              </th>
              <th onClick={() => handleSort("tier")} className="sortable-header">
                Tier {renderSortIndicator("tier")}
              </th>
              <th onClick={() => handleSort("types")} className="sortable-header">
                Types {renderSortIndicator("types")}
              </th>
              <th onClick={() => handleSort("abilities")} className="sortable-header">
                Abilities {renderSortIndicator("abilities")}
              </th>
              <th onClick={() => handleSort("baseStats.hp")} className="sortable-header">
                HP {renderSortIndicator("baseStats.hp")}
              </th>
              <th onClick={() => handleSort("baseStats.atk")} className="sortable-header">
                ATK {renderSortIndicator("baseStats.atk")}
              </th>
              <th onClick={() => handleSort("baseStats.def")} className="sortable-header">
                DEF {renderSortIndicator("baseStats.def")}
              </th>
              <th onClick={() => handleSort("baseStats.spa")} className="sortable-header">
                SPA {renderSortIndicator("baseStats.spa")}
              </th>
              <th onClick={() => handleSort("baseStats.spd")} className="sortable-header">
                SPD {renderSortIndicator("baseStats.spd")}
              </th>
              <th onClick={() => handleSort("baseStats.spe")} className="sortable-header">
                SPE {renderSortIndicator("baseStats.spe")}
              </th>
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
