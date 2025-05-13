import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import apiService from "../services/apiService";

// Create context
const PokemonDataContext = createContext(null);

// Constantes para definir los recursos disponibles
const RESOURCE_KEYS = ["pokemons", "moves", "movesDesc", "learnsets", "items", "abilities", "types"];

// Utility for tracking loaded resources
const createResourceTracker = () => {
  const resources = {};
  RESOURCE_KEYS.forEach((key) => {
    resources[key] = {
      loaded: false,
      loading: false,
      data: key === "pokemons" ? [] : {},
      error: null,
    };
  });
  return resources;
};

export const PokemonDataProvider = ({ children }) => {
  // Obtener estado de autenticación
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Track resource loading state for each data type
  const [resources, setResources] = useState(createResourceTracker());

  // Referencias para controlar el estado de carga
  const dataLoadingRef = useRef(false);
  const dataLoadedRef = useRef(false);

  // A single function to load a specific resource
  const loadResource = useCallback(
    async (resourceName) => {
      // Si no está autenticado, no cargar datos
      if (!isAuthenticated) {
        return Promise.resolve(resourceName === "pokemons" ? [] : {});
      }

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

      try {
        let data;

        // Usar el método adecuado según el tipo de recurso
        switch (resourceName) {
          case "pokemons":
            data = await apiService.getAvailablePokemons();
            break;
          case "moves":
            data = await apiService.getMoves();
            break;
          case "movesDesc":
            data = await apiService.getMovesDesc();
            break;
          case "learnsets":
            data = await apiService.getLearnsets();
            break;
          case "items":
            data = await apiService.getItems();
            break;
          case "abilities":
            data = await apiService.getAbilities();
            break;
          case "types":
            data = await apiService.getTypes();
            break;
          default:
            throw new Error(`Tipo de recurso desconocido: ${resourceName}`);
        }

        if (!data.success) {
          throw new Error(data.message || `Error cargando ${resourceName}`);
        }

        const endTime = performance.now();
        console.log(`✅ ${resourceName} loaded in ${(endTime - startTime).toFixed(2)}ms`);

        // Actualizar el estado del recurso con los datos extraídos
        setResources((prev) => ({
          ...prev,
          [resourceName]: {
            loading: false,
            loaded: true,
            data: data.data,
            error: null,
          },
        }));

        return data.data;
      } catch (error) {
        console.error(`❌ Error loading ${resourceName}:`, error);
        const defaultValue = resourceName === "pokemons" ? [] : {};

        setResources((prev) => ({
          ...prev,
          [resourceName]: {
            loading: false,
            loaded: false,
            data: defaultValue,
            error: error.message,
          },
        }));
        return defaultValue;
      }
    },
    [resources, isAuthenticated]
  );

  // Generic getter function creator
  const createResourceGetter = (resourceName) => {
    return useCallback(() => {
      if (!isAuthenticated) {
        return Promise.resolve(resourceName === "pokemons" ? [] : {});
      }

      return resources[resourceName].loaded
        ? Promise.resolve(resources[resourceName].data)
        : loadResource(resourceName);
    }, [resources[resourceName].loaded, isAuthenticated]);
  };

  // Specific getters for each resource
  const getPokemons = createResourceGetter("pokemons");
  const getLearnsets = createResourceGetter("learnsets");
  const getItems = createResourceGetter("items");
  const getAbilities = createResourceGetter("abilities");
  const getTypes = createResourceGetter("types");
  const getMovesDesc = createResourceGetter("movesDesc");

  // Special case for moves which requires combining with descriptions
  const getMoves = useCallback(async () => {
    if (!isAuthenticated) {
      return Promise.resolve({});
    }

    if (resources.moves.loaded) {
      return Promise.resolve(resources.moves.data);
    }

    try {
      const [movesData, movesDescData] = await Promise.all([loadResource("moves"), loadResource("movesDesc")]);

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
  }, [resources.moves.loaded, loadResource, isAuthenticated]);

  const areAllResourcesLoaded = useCallback(() => {
    return RESOURCE_KEYS.every((key) => resources[key].loaded);
  }, [resources]);

  // Preload all data on mount, but only if authenticated
  useEffect(() => {
    // No cargar si estamos en proceso de autenticación
    if (authLoading) {
      return;
    }

    // No cargar si no está autenticado
    if (!isAuthenticated) {
      // Si el usuario cierra sesión, resetear los datos
      if (dataLoadedRef.current) {
        setResources(createResourceTracker());
        dataLoadedRef.current = false;
      }
      return;
    }

    // No cargar si ya está cargando o ya cargó
    if (dataLoadingRef.current || dataLoadedRef.current) {
      return;
    }

    // Marcar como cargando
    dataLoadingRef.current = true;

    const preloadAllData = async () => {
      if (areAllResourcesLoaded()) {
        dataLoadedRef.current = true;
        dataLoadingRef.current = false;
        return;
      }

      console.log("🔄 Preloading all Pokémon data...");

      try {
        // Indicar que estamos cargando todos los datos
        setResources((prev) => {
          const newState = { ...prev };
          RESOURCE_KEYS.forEach((key) => {
            newState[key] = { ...prev[key], loading: true };
          });
          return newState;
        });

        const startTime = performance.now();

        // Preparar las promesas para cargar los datos
        const promises = [
          apiService.getAvailablePokemons(),
          apiService.getMoves(),
          apiService.getMovesDesc(),
          apiService.getLearnsets(),
          apiService.getItems(),
          apiService.getAbilities(),
          apiService.getTypes(),
        ];

        // Cargar datos en paralelo
        const results = await Promise.allSettled(promises);

        const endTime = performance.now();
        console.log(`⏱️ Data fetch attempts completed in ${(endTime - startTime).toFixed(2)}ms`);

        // Procesar resultados
        const newResources = { ...resources };

        // Procesar cada resultado
        RESOURCE_KEYS.forEach((key, index) => {
          const result = results[index];
          const defaultValue = key === "pokemons" ? [] : {};

          if (result.status === "fulfilled" && result.value.success) {
            newResources[key] = {
              loaded: true,
              loading: false,
              data: result.value.data,
              error: null,
            };

            const logMessage =
              key === "pokemons"
                ? `✅ Successfully loaded ${result.value.data.length} Pokémon`
                : `✅ Successfully loaded ${key}`;
            console.log(logMessage);
          } else {
            newResources[key] = {
              loaded: false,
              loading: false,
              data: defaultValue,
              error: result.reason ? result.reason.message : "Error en la respuesta del servidor",
            };
            console.error(`❌ Failed to load ${key} data:`, result.reason);
          }
        });

        setResources(newResources);
        dataLoadedRef.current = true;

        const allSuccess = results.every((r) => r.status === "fulfilled" && r.value.success);
        if (allSuccess) {
          console.log("✅ All data preloaded successfully");
        } else {
          console.warn("⚠️ Some data failed to load, see errors above");
        }
      } catch (error) {
        console.error("❌ Unexpected error during data preloading:", error);

        // Actualizar estado para reflejar el error
        setResources((prev) => {
          const newState = { ...prev };
          RESOURCE_KEYS.forEach((key) => {
            newState[key] = { ...prev[key], loading: false, error: error.message };
          });
          return newState;
        });
      } finally {
        dataLoadingRef.current = false;
      }
    };

    preloadAllData();
  }, [isAuthenticated, authLoading, areAllResourcesLoaded]);

  // Construir de forma dinámica el objeto value para el contexto
  const buildContextValue = () => {
    // Datos básicos con getters
    const value = {
      getPokemons,
      getMoves,
      getMovesDesc,
      getLearnsets,
      getItems,
      getAbilities,
      getTypes,

      // Acceso directo a datos
      isLoading: RESOURCE_KEYS.some((key) => resources[key].loading) || dataLoadingRef.current,
      isAllDataLoaded: areAllResourcesLoaded(),
    };

    // Agregar estados de carga y datos para cada recurso
    RESOURCE_KEYS.forEach((key) => {
      value[`${key}Loaded`] = resources[key].loaded;
      value[`${key}Loading`] = resources[key].loading;
      value[`${key}Error`] = resources[key].error;
      value[key] = resources[key].data;
    });

    return value;
  };

  return <PokemonDataContext.Provider value={buildContextValue()}>{children}</PokemonDataContext.Provider>;
};

// Custom hook to use the context
export const usePokemonData = () => {
  const context = useContext(PokemonDataContext);
  if (context === null) {
    throw new Error("usePokemonData must be used within a PokemonDataProvider");
  }
  return context;
};
