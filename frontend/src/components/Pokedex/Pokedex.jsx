import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import "../../styles/Pokedex.css";

const Pokedex = () => {
  const { getPokemons, pokemonsLoaded } = usePokemonData();
  const [pokemons, setPokemons] = useState([]);
  const [displayedPokemons, setDisplayedPokemons] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set(["show-all"]));

  const pageSize = 15;
  const pokemonListRef = useRef(null);

  // Cargar pokémon desde la API
  useEffect(() => {
    const loadPokemons = async () => {
      if (pokemonsLoaded) {
        try {
          const pokemonData = await getPokemons();
          setPokemons(pokemonData);
          // Mostrar los primeros 15 pokémon
          setDisplayedPokemons(pokemonData.slice(0, pageSize));
          setCurrentPage(1);
        } catch (error) {
          console.error("Error loading Pokémon:", error);
        }
      }
    };

    loadPokemons();
  }, [pokemonsLoaded, getPokemons]);

  // Formatear ID del pokémon
  const formatPokemonId = (id) => {
    return id.toString().padStart(3, "0");
  };

  // Formatear tipos del pokémon
  const formatPokemonTypes = (types) => {
    return types.map((type) => <img src={`./assets/type-icons/${type}_banner.png`} alt={type} />);
  };

  // Crear tarjeta de pokémon
  const createPokemonCard = (pokemon) => {
    const pokemonId = formatPokemonId(pokemon.num);
    const pokemonTypes = formatPokemonTypes(pokemon.types);

    console.log(pokemon);

    return (
      <div key={pokemon.id} className="pokemon visible" id={pokemonId} onClick={() => handlePokemonClick(pokemon)}>
        <p
          className="pokemon-id-back"
          style={{
            "--pokemon-id": `"#${pokemonId}"`,
            "--pokemon-background": generateTypeBackground(pokemon.types),
          }}
        >
          #{pokemonId}
        </p>
        <div className="pokedex-pokemon-img">
          <img src={`./assets/pokemon-small-hd-sprites-webp/${pokemon.image}`} alt={pokemon.name} />
        </div>
        <div className="pokemon-info">
          <div className="name-container">
            <h4 className="pokemon-name">{pokemon.name}</h4>
          </div>
          <div className="pokemon-types-pokedex">{pokemonTypes}</div>
        </div>
      </div>
    );
  };

  // Generar fondo de tipos
  const generateTypeBackground = (types) => {
    const lowerCaseTypes = types.map((type) => type.toLowerCase());
    if (lowerCaseTypes.length === 2) {
      return `linear-gradient(90deg, var(--type-${lowerCaseTypes[0]}) 0%, var(--type-${lowerCaseTypes[1]}) 100%)`;
    } else if (lowerCaseTypes.length === 1) {
      return `linear-gradient(90deg, var(--type-${lowerCaseTypes[0]}) 0%, var(--type-${lowerCaseTypes[0]}) 100%)`;
    }
    return "none";
  };

  // Cargar más pokémon
  const loadMorePokemons = () => {
    const start = currentPage * pageSize;
    const newPokemons = pokemons.slice(start, start + pageSize);

    if (newPokemons.length > 0) {
      setDisplayedPokemons((prev) => [...prev, ...newPokemons]);
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Manejar clic en pokémon
  const handlePokemonClick = async (pokemon) => {
    setSelectedPokemon(pokemon);
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPokemon(null);
  };

  // Renderizar estadísticas del pokémon
  const renderPokemonStats = (baseStats) => {
    const statNames = {
      hp: "HP",
      attack: "Atk",
      defense: "Def",
      "special-attack": "Sp. Atk",
      "special-defense": "Sp. Def",
      speed: "Spd",
    };

    return Object.entries(baseStats).map(([statName, statValue]) => {
      const displayName = statNames[statName] || statName;
      const statPercentage = Math.min((statValue / 255) * 100, 100);

      return (
        <div key={statName} className="stat-bar">
          <span className="stat-name">{displayName}</span>
          <div className="bar-container">
            <div
              className="bar"
              style={{
                background: "var(--type-grass)",
                width: `${statPercentage}%`,
              }}
            />
          </div>
          <span className="stat-value">{statValue}</span>
        </div>
      );
    });
  };

  // Manejar filtros (simplificado, sin funcionalidad por ahora)
  const handleFilterClick = (filterId) => {
    console.log("Filter clicked:", filterId);
    // Por ahora solo cambiamos el estado visual
  };

  return (
    <div className="pokedex-container">
      <header>
        <nav>
          <img src="./img/pokedex-logo.png" alt="Logo Pokédex" width="200px" />
          <ul className="nav-list">
            <li className="nav-item">
              <button
                className="btn btn-header show-all"
                id="show-all"
                onClick={() => handleFilterClick("show-all")}
                style={{ boxShadow: "var(--type-show-all-bs) 0px 0px 0px 3px" }}
              >
                <img src="./assets/pokeball.svg" alt="pokeball" />
              </button>
            </li>
            {[
              "normal",
              "fire",
              "water",
              "grass",
              "electric",
              "ice",
              "fighting",
              "poison",
              "ground",
              "flying",
              "psychic",
              "bug",
              "rock",
              "ghost",
              "dragon",
              "dark",
              "steel",
              "fairy",
            ].map((type) => (
              <li key={type} className="nav-item">
                <button
                  className={`btn btn-header ${type}`}
                  id={type}
                  onClick={() => handleFilterClick(type)}
                  style={{
                    boxShadow: `var(--type-${type}-bs) 0px 0px 0px 3px`,
                    background: `var(--type-${type})`,
                  }}
                >
                  <img
                    src={`./assets/type-icons/${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}_icon.png`}
                    alt={type}
                  />
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main>
        <div id="container">
          <div className="all-pokemons" id="pokemon-list" ref={pokemonListRef}>
            {displayedPokemons.map((pokemon) => createPokemonCard(pokemon))}
          </div>

          {displayedPokemons.length < pokemons.length && (
            <button id="load-more" onClick={loadMorePokemons}>
              <i className="fa-regular fa-magnifying-glass"></i>
              Discover more Pokémons
            </button>
          )}

          {showModal && (
            <>
              <div id="overlay" onClick={closeModal}></div>
              <div id="pokemon-more-info" style={{ display: "flex" }}>
                <button className="close-button" onClick={closeModal}>
                  <i className="fa-regular fa-xmark-large"></i>
                </button>
                <div className="modal-content">
                  {selectedPokemon && (
                    <>
                      <span className="modal-content-title">
                        <h2>
                          {selectedPokemon.name} (#{formatPokemonId(selectedPokemon.num)})
                        </h2>
                      </span>
                      <span className="modal-content-info">
                        <div className="pokemon-detail-image">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M 7.15 10.286 L 0.122 10.286 C 0.953 4.47 5.955 0 12 0 C 18.045 0 23.047 4.47 23.879 10.286 L 16.85 10.286 C 16.144 8.288 14.239 6.857 12 6.857 C 9.761 6.857 7.856 8.288 7.15 10.286 Z"
                              fill={`var(--type-${selectedPokemon.types[0]})`}
                            />
                            <path
                              d="M14.8571 12C14.8571 13.578 13.578 14.8571 12 14.8571C10.422 14.8571 9.14286 13.578 9.14286 12C9.14286 10.422 10.422 9.14286 12 9.14286C13.578 9.14286 14.8571 10.422 14.8571 12Z"
                              fill="var(--clr-gray)"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M 12 24 C 18.045 24 23.047 19.53 23.879 13.714 L 16.85 13.714 C 16.144 15.712 14.239 17.143 12 17.143 C 9.761 17.143 7.856 15.712 7.15 13.714 L 0.122 13.714 C 0.953 19.53 5.955 24 12 24 Z"
                              fill={`var(--type-${selectedPokemon.types[1] || selectedPokemon.types[0]})`}
                            />
                          </svg>
                          <img
                            src={`./img/pokemon/${selectedPokemon.image}`}
                            alt={selectedPokemon.name}
                            className="pokemon-image-modal"
                          />
                        </div>

                        <div className="pokemon-information">
                          <p>
                            <strong>Tipo:</strong> {selectedPokemon.types.join(", ")}
                          </p>
                          <p>
                            <strong>Tier:</strong> {selectedPokemon.tier}
                          </p>
                          <p>
                            <strong>Habilidades:</strong> {selectedPokemon.abilities.join(", ")}
                          </p>
                        </div>

                        <div className="pokemon-description">
                          <p>Información detallada del Pokémon {selectedPokemon.name}.</p>
                        </div>

                        <div className="pokemon-stats-chart">
                          <strong>Estadísticas base:</strong>
                          {renderPokemonStats(selectedPokemon.baseStats)}
                        </div>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Pokedex;
