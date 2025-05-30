import React, { useState, useEffect, useRef, useMemo } from "react";
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

  const pageSize = 60;
  const pokemonListRef = useRef(null);

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
  const loadMorePokemons = () => {
    const start = currentPage * pageSize;
    const newPokemons = filteredPokemons.slice(start, start + pageSize);

    if (newPokemons.length > 0) {
      setDisplayedPokemons((prev) => [...prev, ...newPokemons]);
      setCurrentPage((prev) => prev + 1);
    }
  };

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
        <div id="container">
          <div className="all-pokemons" id="pokemon-list" ref={pokemonListRef}>
            {displayedPokemons.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} onClick={handlePokemonClick} />
            ))}
          </div>

          {displayedPokemons.length < filteredPokemons.length && (
            <button id="load-more" onClick={loadMorePokemons}>
              <i className="fa-regular fa-magnifying-glass"></i>
              Discover more Pokémons
            </button>
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
