import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";

// Create context
const PokemonDataContext = createContext(null);

// Utility for tracking loaded resources
const createResourceTracker = () => {
  const resources = {
    pokemons: { loaded: false, loading: false, data: [], error: null },
    moves: { loaded: false, loading: false, data: {}, error: null },
    learnsets: { loaded: false, loading: false, data: {}, error: null },
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

      return fetch(
        `http://localhost:5000/data/${
          resourceName === "pokemons" ? "availablePokemons" : resourceName
        }`
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load ${resourceName}: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          const endTime = performance.now();
          console.log(
            `✅ ${resourceName} loaded in ${(endTime - startTime).toFixed(2)}ms`
          );

          // Update resource state
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
              data: resourceName === "pokemons" ? [] : {},
              error: error.message,
            },
          }));
          return resourceName === "pokemons" ? [] : {};
        });
    },
    [resources]
  );

  // Exposed methods for components to request data
  const getPokemons = useCallback(() => {
    return resources.pokemons.loaded
      ? Promise.resolve(resources.pokemons.data)
      : loadResource("pokemons");
  }, [resources.pokemons.loaded, loadResource]);

  const getMoves = useCallback(() => {
    return resources.moves.loaded
      ? Promise.resolve(resources.moves.data)
      : loadResource("moves");
  }, [resources.moves.loaded, loadResource]);

  const getLearnsets = useCallback(() => {
    return resources.learnsets.loaded
      ? Promise.resolve(resources.learnsets.data)
      : loadResource("learnsets");
  }, [resources.learnsets.loaded, loadResource]);

  // Optional: Preload all data on mount
  useEffect(() => {
    const preloadAllData = async () => {
      try {
        // Load resources in sequence to avoid overwhelming the server
        await getPokemons();
        await getMoves();
        await getLearnsets();
        console.log("✅ All data preloaded successfully");
      } catch (error) {
        console.error("❌ Error preloading data:", error);
      }
    };

    preloadAllData();
  }, [getPokemons, getMoves, getLearnsets]);

  const value = {
    // Resource states
    pokemonsLoaded: resources.pokemons.loaded,
    pokemonsLoading: resources.pokemons.loading,
    pokemonsError: resources.pokemons.error,

    movesLoaded: resources.moves.loaded,
    movesLoading: resources.moves.loading,
    movesError: resources.moves.error,

    learnsetsLoaded: resources.learnsets.loaded,
    learnsetsLoading: resources.learnsets.loading,
    learnsetsError: resources.learnsets.error,

    // Data getters with loading mechanisms
    getPokemons,
    getMoves,
    getLearnsets,

    // Direct data access if already loaded
    pokemons: resources.pokemons.data,
    moves: resources.moves.data,
    learnsets: resources.learnsets.data,

    // Helper to get overall loading state
    isLoading:
      resources.pokemons.loading ||
      resources.moves.loading ||
      resources.learnsets.loading,

    // Helper to check if all data is loaded
    isAllDataLoaded:
      resources.pokemons.loaded &&
      resources.moves.loaded &&
      resources.learnsets.loaded,
  };

  return (
    <PokemonDataContext.Provider value={value}>
      {children}
    </PokemonDataContext.Provider>
  );
};

// Custom hook to use the context
export const usePokemonData = () => {
  const context = useContext(PokemonDataContext);
  if (context === null) {
    throw new Error("usePokemonData must be used within a PokemonDataProvider");
  }
  return context;
};
