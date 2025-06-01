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

  const pageSize = 60;
  const containerRef = useRef(null);

  // Cargar pokémon desde la API
  useEffect(() => {
    const loadPokemons = async () => {
      if (allPokemonsLoaded) {
        try {
          const pokemonData = await getAllPokemons();

          // Filtrar Pokémon regionales (que tienen baseSpecies)
          const filteredPokemons = pokemonData.filter((pokemon) => !pokemon.baseSpecies);

          setPokemons(filteredPokemons);
          console.log(`Total Pokémon cargados: ${pokemonData.length}`);
          console.log(`Pokémon mostrados (sin regionales): ${filteredPokemons.length}`);
        } catch (error) {
          console.error("Error loading Pokémon:", error);
        }
      }
    };

    loadPokemons();
  }, [allPokemonsLoaded, getAllPokemons]);

  // Función para filtrar por término de búsqueda
  const filterBySearch = useCallback((pokemonList, term) => {
    if (!term.trim()) return pokemonList;

    const searchLower = term.toLowerCase().trim();
    return pokemonList.filter((pokemon) => {
      return (
        pokemon.name.toLowerCase().includes(searchLower) ||
        pokemon.types.some((type) => type.toLowerCase().includes(searchLower)) ||
        (pokemon.abilities && pokemon.abilities.some((ability) => ability.toLowerCase().includes(searchLower))) ||
        pokemon.id.toString().includes(searchLower)
      );
    });
  }, []);

  // Aplicar filtros cuando cambien los Pokémon, los filtros activos o el término de búsqueda
  const filteredPokemons = useMemo(() => {
    // Primero aplicar filtros de tipo
    const typeFiltered = filterPokemons(pokemons, activeFilters);

    // Luego aplicar filtro de búsqueda
    return filterBySearch(typeFiltered, searchTerm);
  }, [pokemons, activeFilters, searchTerm, filterBySearch]);

  // Actualizar Pokémon mostrados cuando cambien los filtrados
  useEffect(() => {
    // Reset del estado de carga cuando cambian los filtros
    setIsLoading(false);

    if (filteredPokemons.length > 0) {
      setDisplayedPokemons(filteredPokemons.slice(0, pageSize));
      setCurrentPage(1);
    } else {
      setDisplayedPokemons([]);
      setCurrentPage(0);
    }

    // Scroll al inicio cuando cambian los filtros
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [filteredPokemons, pageSize]);

  // Cargar más pokémon
  const loadMorePokemons = useCallback(() => {
    // Verificar si ya estamos cargando o si no hay más pokémon que cargar
    if (isLoading || displayedPokemons.length >= filteredPokemons.length) return;

    setIsLoading(true);

    // Usar el estado actual de displayedPokemons para calcular el siguiente lote
    const currentDisplayedCount = displayedPokemons.length;
    const newPokemons = filteredPokemons.slice(currentDisplayedCount, currentDisplayedCount + pageSize);

    if (newPokemons.length > 0) {
      // Simular un pequeño delay para evitar cargas muy rápidas
      setTimeout(() => {
        setDisplayedPokemons((prev) => {
          // Verificar que no se dupliquen pokémon
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNewPokemons = newPokemons.filter((p) => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPokemons];
        });
        setCurrentPage((prev) => prev + 1);
        setIsLoading(false);
      }, 150); // Reducido a 150ms para mejor respuesta
    } else {
      setIsLoading(false);
    }
  }, [displayedPokemons.length, pageSize, filteredPokemons, isLoading]);

  // Detectar cuando el usuario está cerca del final del scroll con throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = container;

          // Cargar más cuando estés a 300px del final y no estés ya cargando
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

  // Manejar clic en pokémon
  const handlePokemonClick = (pokemon) => {
    console.log("Pokémon clicked:", pokemon.name);
    setSelectedPokemon(pokemon);
    setIsPanelOpen(true);
  };

  // Manejar cambio de Pokémon desde la línea evolutiva
  const handlePokemonChange = (newPokemon) => {
    console.log("Pokémon changed to:", newPokemon.name);
    setSelectedPokemon(newPokemon);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedPokemon(null), 300); // Delay para la animación
  };

  // Manejar filtros
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

  // Manejar búsqueda
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleSearchClear = () => {
    setSearchTerm("");
  };

  return (
    <div className="pokedex-container">
      {/* Header con buscador */}
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
            placeholder="Buscar Pokémon por nombre, tipo, habilidad o número..."
            className="pokedex-search"
            icon="fa-search"
          />
        </div>
        <TypeFilter onFilterClick={handleFilterClick} activeFilters={activeFilters} />
      </nav>

      <main className={isPanelOpen ? "with-panel" : ""}>
        <div id="container" ref={containerRef} className={isPanelOpen ? "with-side-panel" : ""}>
          <div className={`all-pokemons ${isPanelOpen ? "with-side-panel" : ""}`} id="pokemon-list">
            {displayedPokemons.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} onClick={handlePokemonClick} />
            ))}
          </div>

          {/* Indicadores de carga */}
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Cargando más Pokémon...</p>
            </div>
          )}

          {displayedPokemons.length >= filteredPokemons.length && filteredPokemons.length > 0 && (
            <div className="end-message">
              <p>¡Has visto todos los Pokémon disponibles!</p>
            </div>
          )}

          {filteredPokemons.length === 0 && pokemons.length > 0 && (
            <div className="no-results">
              {searchTerm ? (
                <div className="no-search-results">
                  <i className="fas fa-search-minus"></i>
                  <p>
                    No se encontraron Pokémon que coincidan con "<strong>{searchTerm}</strong>"
                  </p>
                  <p className="suggestion">Intenta buscar por nombre, tipo, habilidad o número del Pokémon</p>
                  <button className="clear-search-btn" onClick={handleSearchClear}>
                    <i className="fas fa-times"></i>
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <p>No se encontraron Pokémon con los filtros seleccionados.</p>
              )}
            </div>
          )}
        </div>

        {/* Panel Lateral */}
        <PokemonSidePanel
          pokemon={selectedPokemon}
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
          onPokemonChange={handlePokemonChange}
        />
      </main>
    </div>
  );
};

export default Pokedex;
