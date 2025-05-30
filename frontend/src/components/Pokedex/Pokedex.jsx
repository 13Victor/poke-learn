import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import PokemonCard from "./PokemonCard";
import TypeFilter from "./TypeFilter";
import { createInitialFilters, toggleShowAll, toggleType, filterPokemons } from "../../utils/filterUtils";
import "../../styles/Pokedex.css";

const Pokedex = () => {
  const { getAllPokemons, allPokemonsLoaded } = usePokemonData();
  const [pokemons, setPokemons] = useState([]);
  const [displayedPokemons, setDisplayedPokemons] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilters, setActiveFilters] = useState(createInitialFilters());
  const [isLoading, setIsLoading] = useState(false);

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

  // Aplicar filtros cuando cambien los Pokémon o los filtros activos
  const filteredPokemons = useMemo(() => {
    return filterPokemons(pokemons, activeFilters);
  }, [pokemons, activeFilters]);

  // Actualizar Pokémon mostrados cuando cambien los filtrados
  useEffect(() => {
    if (filteredPokemons.length > 0) {
      setDisplayedPokemons(filteredPokemons.slice(0, pageSize));
      setCurrentPage(1);
    } else {
      setDisplayedPokemons([]);
      setCurrentPage(0);
    }
  }, [filteredPokemons, pageSize]);

  // Cargar más pokémon
  const loadMorePokemons = useCallback(() => {
    if (isLoading) return;

    const start = currentPage * pageSize;
    const newPokemons = filteredPokemons.slice(start, start + pageSize);

    if (newPokemons.length > 0) {
      setIsLoading(true);

      // Simular un pequeño delay para evitar cargas muy rápidas
      setTimeout(() => {
        setDisplayedPokemons((prev) => [...prev, ...newPokemons]);
        setCurrentPage((prev) => prev + 1);
        setIsLoading(false);
      }, 200);
    }
  }, [currentPage, pageSize, filteredPokemons, isLoading]);

  // Detectar cuando el usuario está cerca del final del scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;

      // Cargar más cuando estés a 200px del final
      if (scrollHeight - scrollTop <= clientHeight + 200) {
        loadMorePokemons();
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [loadMorePokemons]);

  // Manejar clic en pokémon (por ahora solo log)
  const handlePokemonClick = (pokemon) => {
    console.log("Pokémon clicked:", pokemon.name);
    // Aquí puedes agregar la lógica que necesites para el clic
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

  return (
    <div className="pokedex-container">
      <TypeFilter onFilterClick={handleFilterClick} activeFilters={activeFilters} />

      <main>
        <div id="container" ref={containerRef}>
          <div className="all-pokemons" id="pokemon-list">
            {displayedPokemons.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} onClick={handlePokemonClick} />
            ))}
          </div>

          {/* Mostrar indicador de carga cuando esté cargando más */}
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Cargando más Pokémon...</p>
            </div>
          )}

          {/* Mostrar cuando se han cargado todos los Pokémon */}
          {displayedPokemons.length >= filteredPokemons.length && filteredPokemons.length > 0 && (
            <div className="end-message">
              <p>¡Has visto todos los Pokémon disponibles!</p>
            </div>
          )}

          {filteredPokemons.length === 0 && pokemons.length > 0 && (
            <div className="no-results">
              <p>No se encontraron Pokémon con los filtros seleccionados.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Pokedex;
