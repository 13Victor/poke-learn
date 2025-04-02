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

  // Preload all data on mount
  useEffect(() => {
    const preloadAllData = async () => {
      // Si ya están cargados todos los datos, no hacer nada
      if (
        resources.pokemons.loaded &&
        resources.moves.loaded &&
        resources.learnsets.loaded
      ) {
        return;
      }

      console.log("🔄 Preloading all Pokémon data...");

      try {
        // Indicar que estamos cargando todos los datos
        setResources((prev) => ({
          pokemons: { ...prev.pokemons, loading: true },
          moves: { ...prev.moves, loading: true },
          learnsets: { ...prev.learnsets, loading: true },
        }));

        const startTime = performance.now();

        // Cargar datos en paralelo
        const results = await Promise.allSettled([
          fetch("http://localhost:5000/data/availablePokemons").then((r) =>
            r.ok ? r.json() : Promise.reject(`Failed with status: ${r.status}`)
          ),
          fetch("http://localhost:5000/data/moves").then((r) =>
            r.ok ? r.json() : Promise.reject(`Failed with status: ${r.status}`)
          ),
          fetch("http://localhost:5000/data/learnsets").then((r) =>
            r.ok ? r.json() : Promise.reject(`Failed with status: ${r.status}`)
          ),
        ]);

        const endTime = performance.now();
        console.log(
          `⏱️ Data fetch attempts completed in ${(endTime - startTime).toFixed(
            2
          )}ms`
        );

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
          console.log(
            `✅ Successfully loaded ${results[0].value.length} Pokémon`
          );
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

        // Learnsets data
        if (results[2].status === "fulfilled") {
          newResources.learnsets = {
            loaded: true,
            loading: false,
            data: results[2].value,
            error: null,
          };
          console.log(`✅ Successfully loaded learnsets`);
        } else {
          newResources.learnsets = {
            loaded: false,
            loading: false,
            data: {},
            error: results[2].reason,
          };
          console.error("❌ Failed to load learnsets data:", results[2].reason);
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
          learnsets: {
            ...prev.learnsets,
            loading: false,
            error: error.message,
          },
        }));
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
