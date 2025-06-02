import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import PokemonCard from "./PokemonCard";
import TypeFilter from "./TypeFilter";
import PokemonSidePanel from "./PokemonSidePanel";
import SearchInput from "../common/SearchInput";
import { createInitialFilters, toggleShowAll, toggleType, filterPokemons } from "../../utils/filterUtils";
import "../../styles/Pokedex.css";

const Pokedex = () => {
  const { getAllPokemons, allPokemonsLoaded } = usePokemonData();
  const [pokemons, setPokemons] = useState([]);
  const [displayedPokemons, setDisplayedPokemons] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilters, setActiveFilters] = useState(createInitialFilters());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false); // To control DOM visibility

  const pageSize = 60;
  const containerRef = useRef(null);

  // Load pokémon from API
  useEffect(() => {
    const loadPokemons = async () => {
      if (allPokemonsLoaded) {
        try {
          const pokemonData = await getAllPokemons();

          // Filter regional Pokémon (those with baseSpecies)
          const filteredPokemons = pokemonData.filter((pokemon) => !pokemon.baseSpecies);

          setPokemons(filteredPokemons);
          console.log(`Total Pokémon loaded: ${pokemonData.length}`);
          console.log(`Pokémon displayed (without regionals): ${filteredPokemons.length}`);
        } catch (error) {
          console.error("Error loading Pokémon:", error);
        }
      }
    };

    loadPokemons();
  }, [allPokemonsLoaded, getAllPokemons]);

  // Improved function to filter by search term (including numbers)
  const filterBySearch = useCallback((pokemonList, term) => {
    if (!term.trim()) return pokemonList;

    const searchLower = term.toLowerCase().trim();

    // Check if the term is numeric
    const isNumericSearch = /^\d+$/.test(searchLower);

    return pokemonList.filter((pokemon) => {
      // Search by name, types and abilities (as before)
      const textMatch =
        pokemon.name.toLowerCase().includes(searchLower) ||
        pokemon.types.some((type) => type.toLowerCase().includes(searchLower)) ||
        (pokemon.abilities && pokemon.abilities.some((ability) => ability.toLowerCase().includes(searchLower)));

      // Improved numeric search
      if (isNumericSearch) {
        const pokemonNum = pokemon.num.toString();
        const pokemonId = pokemon.id.toString();

        // Exact search by number
        if (pokemonNum === searchLower || pokemonId === searchLower) {
          return true;
        }

        // Search by numbers that start with the term
        if (pokemonNum.startsWith(searchLower) || pokemonId.startsWith(searchLower)) {
          return true;
        }

        // Also include text search in case they write the number as a string
        if (pokemonNum.includes(searchLower) || pokemonId.includes(searchLower)) {
          return true;
        }
      }

      return textMatch;
    });
  }, []);

  // Apply filters when Pokémon, active filters or search term change
  const filteredPokemons = useMemo(() => {
    // First apply type filters
    const typeFiltered = filterPokemons(pokemons, activeFilters);

    // Then apply search filter
    return filterBySearch(typeFiltered, searchTerm);
  }, [pokemons, activeFilters, searchTerm, filterBySearch]);

  // Update displayed Pokémon when filtered ones change
  useEffect(() => {
    // Reset loading state when filters change
    setIsLoading(false);

    if (filteredPokemons.length > 0) {
      setDisplayedPokemons(filteredPokemons.slice(0, pageSize));
      setCurrentPage(1);
    } else {
      setDisplayedPokemons([]);
      setCurrentPage(0);
    }

    // Scroll to top when filters change
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [filteredPokemons, pageSize]);

  // Load more pokémon
  const loadMorePokemons = useCallback(() => {
    // Check if we're already loading or if there are no more pokémon to load
    if (isLoading || displayedPokemons.length >= filteredPokemons.length) return;

    setIsLoading(true);

    // Use current state of displayedPokemons to calculate next batch
    const currentDisplayedCount = displayedPokemons.length;
    const newPokemons = filteredPokemons.slice(currentDisplayedCount, currentDisplayedCount + pageSize);

    if (newPokemons.length > 0) {
      // Simulate a small delay to avoid very fast loads
      setTimeout(() => {
        setDisplayedPokemons((prev) => {
          // Check that pokémon are not duplicated
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNewPokemons = newPokemons.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPokemons];
        });
        setCurrentPage((prev) => prev + 1);
        setIsLoading(false);
      }, 150); // Reduced to 150ms for better response
    } else {
      setIsLoading(false);
    }
  }, [displayedPokemons.length, pageSize, filteredPokemons, isLoading]);

  // Detect when user is near the end of scroll with throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = container;

          // Load more when you're 300px from the end and not already loading
          if (scrollHeight - scrollTop <= clientHeight + 300 && !isLoading) {
            loadMorePokemons();
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [loadMorePokemons, isLoading]);

  // Handle pokémon click
  const handlePokemonClick = (pokemon) => {
    console.log("Pokémon clicked:", pokemon.name);
    setSelectedPokemon(pokemon);
    setIsPanelVisible(true); // First make the panel visible in DOM
    // Small delay for DOM to update before applying animation
    setTimeout(() => {
      setIsPanelOpen(true);
    }, 10);
  };

  // Handle Pokémon change from evolution line
  const handlePokemonChange = (newPokemon) => {
    console.log("Pokémon changed to:", newPokemon.name);
    setSelectedPokemon(newPokemon);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false); // First remove the class that does the animation
    // After animation ends, remove from DOM
    setTimeout(() => {
      setIsPanelVisible(false);
      setSelectedPokemon(null);
    }, 300); // 300ms matches CSS animation duration
  };

  // Handle filters
  const handleFilterClick = (filterId) => {
    console.log("Filter clicked:", filterId);

    let newFilters;
    if (filterId === "show-all") {
      newFilters = toggleShowAll(activeFilters);
    } else {
      newFilters = toggleType(activeFilters, filterId);
    }

    setActiveFilters(newFilters);
    console.log("Active filters:", Array.from(newFilters));
  };

  // Handle search
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
  };

  return (
    <div className="pokedex-container">
      {/* Header with search */}
      <div className="pokedex-header">
        <div className="header-content">
          <h1 className="pokedex-title">Pokédex</h1>
        </div>
      </div>

      <nav>
        <div className="search-section">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            placeholder="Search Pokémon by name, type, ability or number..."
            className="pokedex-search"
            icon="fa-search"
          />
        </div>
        <TypeFilter onFilterClick={handleFilterClick} activeFilters={activeFilters} />
      </nav>

      <main className={isPanelOpen ? "with-panel" : ""}>
        <div id="container" ref={containerRef} className={isPanelOpen ? "with-side-panel" : ""}>
          <div className={`all-pokemons ${isPanelOpen ? "with-side-panel" : ""}`} id="pokemon-list">
            {displayedPokemons.map((pokemon, index) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} onClick={handlePokemonClick} />
            ))}
          </div>

          {/* Loading indicators */}
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Loading more Pokémon...</p>
            </div>
          )}

          {displayedPokemons.length >= filteredPokemons.length && filteredPokemons.length > 0 && (
            <div className="end-message">
              <p>You've seen all available Pokémon!</p>
            </div>
          )}

          {filteredPokemons.length === 0 && pokemons.length > 0 && (
            <div className="no-results">
              {searchTerm ? (
                <div className="no-search-results">
                  <p>
                    No Pokémon found matching "<strong>{searchTerm}</strong>"
                  </p>
                  <p className="suggestion">Try searching by name, type, ability or Pokémon number</p>
                </div>
              ) : (
                <p>No Pokémon found with the selected filters.</p>
              )}
            </div>
          )}
        </div>

        {/* Side Panel - Only renders if visible */}
        {isPanelVisible && (
          <PokemonSidePanel
            pokemon={selectedPokemon}
            isOpen={isPanelOpen}
            onClose={handlePanelClose}
            onPokemonChange={handlePokemonChange}
          />
        )}
      </main>
    </div>
  );
};

export default Pokedex;
