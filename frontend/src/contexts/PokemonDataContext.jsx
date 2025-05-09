import { createContext, useState, useEffect, useContext, useCallback } from "react";

// Create context
const PokemonDataContext = createContext(null);

// Utility for tracking loaded resources
const createResourceTracker = () => {
  const resources = {
    pokemons: { loaded: false, loading: false, data: [], error: null },
    moves: { loaded: false, loading: false, data: {}, error: null },
    movesDesc: { loaded: false, loading: false, data: {}, error: null }, // Add moves descriptions
    learnsets: { loaded: false, loading: false, data: {}, error: null },
    items: { loaded: false, loading: false, data: {}, error: null },
    abilities: { loaded: false, loading: false, data: {}, error: null },
    types: { loaded: false, loading: false, data: {}, error: null },
  };

  return resources;
};

export const PokemonDataProvider = ({ children }) => {
  // Track resource loading state for each data type
  const [resources, setResources] = useState(createResourceTracker());

  // A single function to load a specific resource
  const loadResource = useCallback(
    (resourceName, url) => {
      // Skip if already loaded or loading
      if (resources[resourceName].loaded || resources[resourceName].loading) {
        return Promise.resolve(resources[resourceName].data);
      }

      // Mark resource as loading
      setResources((prev) => ({
        ...prev,
        [resourceName]: {
          ...prev[resourceName],
          loading: true,
        },
      }));

      const startTime = performance.now();

      // Obtener el token de localStorage
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };

      // Añadir el token a las cabeceras si existe
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      return fetch(`http://localhost:5000/data/${resourceName === "pokemons" ? "availablePokemons" : resourceName}`, {
        headers,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load ${resourceName}: ${res.status}`);
          }
          return res.json();
        })
        .then((responseObj) => {
          const endTime = performance.now();

          // Check if the response follows the expected format
          if (!responseObj.success) {
            throw new Error(responseObj.message || `Error loading ${resourceName}`);
          }

          // Extract the actual data from the response
          const data = responseObj.data;

          console.log(`✅ ${resourceName} loaded in ${(endTime - startTime).toFixed(2)}ms`);

          // Update resource state with the extracted data
          setResources((prev) => ({
            ...prev,
            [resourceName]: {
              loading: false,
              loaded: true,
              data: data,
              error: null,
            },
          }));

          return data;
        })
        .catch((error) => {
          console.error(`❌ Error loading ${resourceName}:`, error);
          setResources((prev) => ({
            ...prev,
            [resourceName]: {
              loading: false,
              loaded: false,
              data: ["pokemons"].includes(resourceName) ? [] : {},
              error: error.message,
            },
          }));
          return ["pokemons"].includes(resourceName) ? [] : {};
        });
    },
    [resources]
  );

  // Exposed methods for components to request data
  const getPokemons = useCallback(() => {
    return resources.pokemons.loaded ? Promise.resolve(resources.pokemons.data) : loadResource("pokemons");
  }, [resources.pokemons.loaded, loadResource]);

  const getMoves = useCallback(async () => {
    if (resources.moves.loaded) {
      return Promise.resolve(resources.moves.data);
    }

    // Load both moves and moves descriptions in parallel
    try {
      const [movesData, movesDescData] = await Promise.all([loadResource("moves"), loadResource("moves-desc")]);

      // Process moves to include descriptions
      const enhancedMoves = { ...movesData };

      // Add descriptions from movesDesc to the moves
      Object.keys(enhancedMoves).forEach((moveId) => {
        const moveDescData = movesDescData[moveId] || {};
        enhancedMoves[moveId] = {
          ...enhancedMoves[moveId],
          shortDesc: moveDescData.shortDesc || enhancedMoves[moveId].shortDesc || "",
          desc: moveDescData.desc || enhancedMoves[moveId].desc || "",
        };
      });

      // Update the moves resource with the enhanced data
      setResources((prev) => ({
        ...prev,
        moves: {
          loading: false,
          loaded: true,
          data: enhancedMoves,
          error: null,
        },
      }));

      return enhancedMoves;
    } catch (error) {
      console.error("Error loading moves with descriptions:", error);
      throw error;
    }
  }, [resources.moves.loaded, loadResource]);

  const getLearnsets = useCallback(() => {
    return resources.learnsets.loaded ? Promise.resolve(resources.learnsets.data) : loadResource("learnsets");
  }, [resources.learnsets.loaded, loadResource]);

  // Simplified items method (now a single endpoint)
  const getItems = useCallback(() => {
    return resources.items.loaded ? Promise.resolve(resources.items.data) : loadResource("items");
  }, [resources.items.loaded, loadResource]);

  // Added abilities method
  const getAbilities = useCallback(() => {
    return resources.abilities.loaded ? Promise.resolve(resources.abilities.data) : loadResource("abilities");
  }, [resources.abilities.loaded, loadResource]);

  // Add getTypes method
  const getTypes = useCallback(() => {
    return resources.types.loaded ? Promise.resolve(resources.types.data) : loadResource("types");
  }, [resources.types.loaded, loadResource]);

  const getMovesDesc = useCallback(() => {
    return resources.movesDesc.loaded ? Promise.resolve(resources.movesDesc.data) : loadResource("moves-desc");
  }, [resources.movesDesc.loaded, loadResource]);

  // Preload all data on mount
  useEffect(() => {
    const preloadAllData = async () => {
      // Si ya están cargados todos los datos, no hacer nada
      if (
        resources.pokemons.loaded &&
        resources.moves.loaded &&
        resources.movesDesc.loaded &&
        resources.learnsets.loaded &&
        resources.items.loaded &&
        resources.abilities.loaded &&
        resources.types.loaded
      ) {
        return;
      }

      console.log("🔄 Preloading all Pokémon data...");

      try {
        // Indicar que estamos cargando todos los datos
        setResources((prev) => ({
          pokemons: { ...prev.pokemons, loading: true },
          moves: { ...prev.moves, loading: true },
          movesDesc: { ...prev.movesDesc, loading: true },
          learnsets: { ...prev.learnsets, loading: true },
          items: { ...prev.items, loading: true },
          abilities: { ...prev.abilities, loading: true },
          types: { ...prev.types, loading: true },
        }));

        const startTime = performance.now();

        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
        };

        // Añadir el token a las cabeceras si existe
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const processResponse = async (response) => {
          if (!response.ok) {
            throw new Error(`Failed with status: ${response.status}`);
          }
          const responseObj = await response.json();
          if (!responseObj.success) {
            throw new Error(responseObj.message || "API returned error");
          }
          return responseObj.data;
        };
        // Cargar datos en paralelo
        const results = await Promise.allSettled([
          fetch("http://localhost:5000/data/availablePokemons", { headers }).then(processResponse),
          fetch("http://localhost:5000/data/moves", { headers }).then(processResponse),
          fetch("http://localhost:5000/data/moves-desc", { headers }).then(processResponse),
          fetch("http://localhost:5000/data/learnsets", { headers }).then(processResponse),
          fetch("http://localhost:5000/data/items", { headers }).then(processResponse),
          fetch("http://localhost:5000/data/abilities", { headers }).then(processResponse),
          fetch("http://localhost:5000/data/types", { headers }).then(processResponse),
        ]);

        const endTime = performance.now();
        console.log(`⏱️ Data fetch attempts completed in ${(endTime - startTime).toFixed(2)}ms`);

        // Procesar resultados
        const newResources = { ...resources };

        // Pokémon data
        if (results[0].status === "fulfilled") {
          newResources.pokemons = {
            loaded: true,
            loading: false,
            data: results[0].value,
            error: null,
          };
          console.log(`✅ Successfully loaded ${results[0].value.length} Pokémon`);
        } else {
          newResources.pokemons = {
            loaded: false,
            loading: false,
            data: [],
            error: results[0].reason,
          };
          console.error("❌ Failed to load Pokémon data:", results[0].reason);
        }

        // Moves data
        if (results[1].status === "fulfilled") {
          newResources.moves = {
            loaded: true,
            loading: false,
            data: results[1].value,
            error: null,
          };
          console.log(`✅ Successfully loaded moves`);
        } else {
          newResources.moves = {
            loaded: false,
            loading: false,
            data: {},
            error: results[1].reason,
          };
          console.error("❌ Failed to load moves data:", results[1].reason);
        }

        // Moves descriptions data
        if (results[2].status === "fulfilled") {
          newResources.movesDesc = {
            loaded: true,
            loading: false,
            data: results[2].value,
            error: null,
          };
          console.log(`✅ Successfully loaded move descriptions`);
        } else {
          newResources.movesDesc = {
            loaded: false,
            loading: false,
            data: {},
            error: results[2].reason,
          };
          console.error("❌ Failed to load move descriptions data:", results[2].reason);
        }

        // Learnsets data
        if (results[3].status === "fulfilled") {
          newResources.learnsets = {
            loaded: true,
            loading: false,
            data: results[3].value,
            error: null,
          };
          console.log(`✅ Successfully loaded learnsets`);
        } else {
          newResources.learnsets = {
            loaded: false,
            loading: false,
            data: {},
            error: results[3].reason,
          };
          console.error("❌ Failed to load learnsets data:", results[3].reason);
        }

        // Items data
        if (results[4].status === "fulfilled") {
          newResources.items = {
            loaded: true,
            loading: false,
            data: results[4].value,
            error: null,
          };
          console.log(`✅ Successfully loaded items with descriptions`);
        } else {
          newResources.items = {
            loaded: false,
            loading: false,
            data: {},
            error: results[4].reason,
          };
          console.error("❌ Failed to load items data:", results[4].reason);
        }

        // Abilities data
        if (results[5].status === "fulfilled") {
          newResources.abilities = {
            loaded: true,
            loading: false,
            data: results[5].value,
            error: null,
          };
          console.log(`✅ Successfully loaded abilities`);
        } else {
          newResources.abilities = {
            loaded: false,
            loading: false,
            data: {},
            error: results[5].reason,
          };
          console.error("❌ Failed to load abilities data:", results[5].reason);
        }

        // Types data
        if (results[6].status === "fulfilled") {
          newResources.types = {
            loaded: true,
            loading: false,
            data: results[6].value,
            error: null,
          };
          console.log(`✅ Successfully loaded types`);
        } else {
          newResources.types = {
            loaded: false,
            loading: false,
            data: {},
            error: results[6].reason,
          };
          console.error("❌ Failed to load types data:", results[6].reason);
        }

        setResources(newResources);

        const allSuccess = results.every((r) => r.status === "fulfilled");
        if (allSuccess) {
          console.log("✅ All data preloaded successfully");
        } else {
          console.warn("⚠️ Some data failed to load, see errors above");
        }
      } catch (error) {
        console.error("❌ Unexpected error during data preloading:", error);

        // Actualizar estado para reflejar el error
        setResources((prev) => ({
          pokemons: { ...prev.pokemons, loading: false, error: error.message },
          moves: { ...prev.moves, loading: false, error: error.message },
          movesDesc: { ...prev.movesDesc, loading: false, error: error.message },
          learnsets: { ...prev.learnsets, loading: false, error: error.message },
          items: { ...prev.items, loading: false, error: error.message },
          abilities: { ...prev.abilities, loading: false, error: error.message },
          types: { ...prev.types, loading: false, error: error.message },
        }));

        console.error("Response status:", error.response?.status);
        console.error("Response data:", error.response?.data);
      }
    };

    preloadAllData();
  }, []); // Sin dependencias - solo se ejecuta una vez al montar

  const value = {
    // Resource states
    pokemonsLoaded: resources.pokemons.loaded,
    pokemonsLoading: resources.pokemons.loading,
    pokemonsError: resources.pokemons.error,

    movesLoaded: resources.moves.loaded,
    movesLoading: resources.moves.loading,
    movesError: resources.moves.error,

    movesDescLoaded: resources.movesDesc.loaded,
    movesDescLoading: resources.movesDesc.loading,
    movesDescError: resources.movesDesc.error,

    learnsetsLoaded: resources.learnsets.loaded,
    learnsetsLoading: resources.learnsets.loading,
    learnsetsError: resources.learnsets.error,

    itemsLoaded: resources.items.loaded,
    itemsLoading: resources.items.loading,
    itemsError: resources.items.error,

    abilitiesLoaded: resources.abilities.loaded,
    abilitiesLoading: resources.abilities.loading,
    abilitiesError: resources.abilities.error,

    typesLoaded: resources.types.loaded,
    typesLoading: resources.types.loading,
    typesError: resources.types.error,

    // Data getters with loading mechanisms
    getPokemons,
    getMoves,
    getMovesDesc,
    getLearnsets,
    getItems,
    getAbilities,
    getTypes,

    // Direct data access if already loaded
    pokemons: resources.pokemons.data,
    moves: resources.moves.data,
    movesDesc: resources.movesDesc.data,
    learnsets: resources.learnsets.data,
    items: resources.items.data,
    abilities: resources.abilities.data,
    types: resources.types.data,

    // La propiedad isLoading
    isLoading:
      resources.pokemons.loading ||
      resources.moves.loading ||
      resources.movesDesc.loading ||
      resources.learnsets.loading ||
      resources.items.loading ||
      resources.abilities.loading ||
      resources.types.loading,

    // Helper to check if all data is loaded
    isAllDataLoaded:
      resources.pokemons.loaded &&
      resources.moves.loaded &&
      resources.movesDesc.loaded &&
      resources.learnsets.loaded &&
      resources.items.loaded &&
      resources.abilities.loaded &&
      resources.types.loaded,
  };

  return <PokemonDataContext.Provider value={value}>{children}</PokemonDataContext.Provider>;
};

// Custom hook to use the context
export const usePokemonData = () => {
  const context = useContext(PokemonDataContext);
  if (context === null) {
    throw new Error("usePokemonData must be used within a PokemonDataProvider");
  }
  return context;
};
