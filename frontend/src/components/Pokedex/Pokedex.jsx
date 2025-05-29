import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import "../../styles/Pokedex.css";

const Pokedex = () => {
  const { getAllPokemons, allPokemonsLoaded } = usePokemonData();
  const [pokemons, setPokemons] = useState([]);
  const [displayedPokemons, setDisplayedPokemons] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set(["show-all"]));

  const pageSize = 1025;
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
          // Mostrar los primeros 15 pokémon
          setDisplayedPokemons(filteredPokemons.slice(0, pageSize));
          setCurrentPage(1);

          console.log(`Total Pokémon cargados: ${pokemonData.length}`);
          console.log(`Pokémon mostrados (sin regionales): ${filteredPokemons.length}`);
        } catch (error) {
          console.error("Error loading Pokémon:", error);
        }
      }
    };

    loadPokemons();
  }, [allPokemonsLoaded, getAllPokemons]);

  // Formatear ID del pokémon
  const formatPokemonId = (id) => {
    return id.toString().padStart(3, "0");
  };

  // Formatear ID del pokémon para las nuevas imágenes (4 dígitos)
  const formatPokemonIdForImage = (id) => {
    return id.toString().padStart(4, "0");
  };

  // Formatear nombre del pokémon para las nuevas imágenes
  const formatPokemonNameForImage = (pokemon, includeBaseForme = true) => {
    let name = pokemon.name;

    // Reemplazar guiones y dos puntos con espacios
    name = name.replace(/[-:]/g, " ");

    // Si el Pokémon tiene baseForme y se solicita incluirlo, añadirlo al nombre
    if (includeBaseForme && pokemon.baseForme) {
      name = `${name} ${pokemon.baseForme}`;
    }

    // Capitalizar la primera letra y mantener el resto
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Función para codificar nombres de archivo de forma segura
  const encodeFileName = (fileName) => {
    // Reemplazar caracteres problemáticos para URLs pero mantener la estructura de ruta
    return fileName
      .replace(/%/g, "%25") // % debe codificarse primero
      .replace(/ /g, "%20") // Espacios
      .replace(/\?/g, "%3F") // Signos de interrogación
      .replace(/#/g, "%23") // Almohadillas
      .replace(/&/g, "%26"); // Ampersands
  };

  // Generar ruta de imagen del pokémon con fallback
  const generatePokemonImagePath = (pokemon, isModal = false) => {
    const formattedId = formatPokemonIdForImage(pokemon.num);

    // Intentar primero con baseForme si existe
    const formattedNameWithForme = formatPokemonNameForImage(pokemon, true);
    const fileName = `${formattedId} ${formattedNameWithForme}.png`;
    const primaryPath = `./assets/official-artwork-pokemon/${encodeFileName(fileName)}`;

    // Debug: mostrar la ruta generada para Pokémon con baseForme
    if (pokemon.baseForme) {
      console.log(`Pokémon con baseForme - ${pokemon.name}:`);
      console.log(`  Ruta generada: ${primaryPath}`);
      console.log(`  baseForme: ${pokemon.baseForme}`);
    }

    return primaryPath;
  };

  // Función para manejar error de imagen y usar fallback
  const handleImageError = (event, pokemon) => {
    const img = event.target;
    const formattedId = formatPokemonIdForImage(pokemon.num);

    // Si la imagen actual incluye baseForme, intentar sin baseForme
    if (pokemon.baseForme && img.src.includes(encodeFileName(pokemon.baseForme))) {
      const formattedNameWithoutForme = formatPokemonNameForImage(pokemon, false);
      const fileName = `${formattedId} ${formattedNameWithoutForme}.png`;
      const fallbackPath = `./assets/official-artwork-pokemon/${encodeFileName(fileName)}`;

      console.log(`Imagen con baseForme falló: ${img.src}`);
      console.log(`Intentando fallback: ${fallbackPath}`);

      img.src = fallbackPath;
    } else {
      // Si ya es el fallback o no tiene baseForme, mostrar imagen por defecto
      console.log(`Imagen fallback también falló: ${img.src}`);
      // Puedes poner aquí una imagen por defecto si quieres
      // img.src = './assets/pokemon-placeholder.png';
    }
  };

  // Formatear tipos del pokémon
  const formatPokemonTypes = (types) => {
    return types.map((type) => <img src={`./assets/type-icons/${type}_banner.png`} alt={type} />);
  };

  // Crear tarjeta de pokémon
  const createPokemonCard = (pokemon) => {
    const pokemonId = formatPokemonId(pokemon.num);
    const pokemonTypes = formatPokemonTypes(pokemon.types);
    const pokemonImagePath = generatePokemonImagePath(pokemon);

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
          <img src={pokemonImagePath} alt={pokemon.name} onError={(e) => handleImageError(e, pokemon)} />
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
                              fill={`var(--type-${selectedPokemon.types[0].toLowerCase()})`}
                            />
                            <path
                              d="M14.8571 12C14.8571 13.578 13.578 14.8571 12 14.8571C10.422 14.8571 9.14286 13.578 9.14286 12C9.14286 10.422 10.422 9.14286 12 9.14286C13.578 9.14286 14.8571 10.422 14.8571 12Z"
                              fill="var(--clr-gray)"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M 12 24 C 18.045 24 23.047 19.53 23.879 13.714 L 16.85 13.714 C 16.144 15.712 14.239 17.143 12 17.143 C 9.761 17.143 7.856 15.712 7.15 13.714 L 0.122 13.714 C 0.953 19.53 5.955 24 12 24 Z"
                              fill={`var(--type-${(
                                selectedPokemon.types[1] || selectedPokemon.types[0]
                              ).toLowerCase()})`}
                            />
                          </svg>
                          <img
                            src={generatePokemonImagePath(selectedPokemon, true)}
                            alt={selectedPokemon.name}
                            className="pokemon-image-modal"
                            onError={(e) => handleImageError(e, selectedPokemon)}
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
