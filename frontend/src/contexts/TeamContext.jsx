import React, { createContext, useContext, useReducer, useMemo, useRef } from "react";

// Definir acciones para el reducer
const ACTIONS = {
  SET_POKEMON: "SET_POKEMON",
  SET_MOVE: "SET_MOVE",
  SET_ITEM: "SET_ITEM",
  SET_ABILITY: "SET_ABILITY",
  SET_ABILITY_TYPE: "SET_ABILITY_TYPE",
  SET_VIEW_MODE: "SET_VIEW_MODE",
  SET_SELECTED_SLOT: "SET_SELECTED_SLOT",
  SET_SELECTED_MOVE: "SET_SELECTED_MOVE",
  SET_FLOW_STAGE: "SET_FLOW_STAGE",
  SET_POKEMON_STATS: "SET_POKEMON_STATS",
  UPDATE_POKEMON_STATS: "UPDATE_POKEMON_STATS",
  UPDATE_TEAM_ANALYSIS: "UPDATE_TEAM_ANALYSIS",
};

const FLOW_STAGES = {
  POKEMON: "pokemon",
  ITEM: "item",
  ABILITY: "ability",
  MOVE_1: "move_1",
  MOVE_2: "move_2",
  MOVE_3: "move_3",
  MOVE_4: "move_4",
  STATS: "stats",
};

// Estado inicial
const initialState = {
  pokemons: Array(6)
    .fill()
    .map(() => ({
      name: "",
      level: 100,
      item: "",
      itemId: "",
      ability: "",
      abilityId: "",
      image: "0000.webp",
      types: [],
      moveset: ["", "", "", ""],
    })),
  viewMode: "pokemon",
  selectedSlot: 0,
  selectedMove: { slot: 0, moveIndex: 0 },
  flowStage: FLOW_STAGES.POKEMON,
  teamAnalysis: {
    coverage: [],
    defense: {},
  },
};

// Reducer para manejar las actualizaciones de estado
function teamReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD_POKEMON_COMPLETE: {
      const { slotIndex, pokemonData } = action.payload;
      const newPokemons = [...state.pokemons];
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        ...pokemonData,
      };
      return {
        ...state,
        pokemons: newPokemons,
      };
    }

    case ACTIONS.SET_POKEMON: {
      const { slotIndex, pokemon } = action.payload;
      const newPokemons = [...state.pokemons];

      // Calcular stats iniciales
      const level = 100;
      const baseStats = pokemon.baseStats || {};
      const initialStats = {
        hp: Math.floor(((2 * baseStats.hp + 31) * level) / 100) + level + 10,
        atk: Math.floor(((2 * baseStats.atk + 31) * level) / 100) + 5,
        def: Math.floor(((2 * baseStats.def + 31) * level) / 100) + 5,
        spa: Math.floor(((2 * baseStats.spa + 31) * level) / 100) + 5,
        spd: Math.floor(((2 * baseStats.spd + 31) * level) / 100) + 5,
        spe: Math.floor(((2 * baseStats.spe + 31) * level) / 100) + 5,
      };

      newPokemons[slotIndex] = {
        ...pokemon,
        level: 100,
        moveset: ["", "", "", ""],
        item: "",
        itemId: "", // Añadimos el itemId vacío
        ability: "",
        abilityId: "", // Añadimos el abilityId vacío
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        nature: "Hardy",
        stats: initialStats,
      };

      return {
        ...state,
        pokemons: newPokemons,
      };
    }

    case ACTIONS.SET_ABILITY: {
      const { slotIndex, ability, abilityId } = action.payload;
      const newPokemons = [...state.pokemons];
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        ability, // Nombre de la habilidad para la UI
        abilityId, // ID de la habilidad para la base de datos
      };
      return {
        ...state,
        pokemons: newPokemons,
      };
    }

    case ACTIONS.SET_MOVE: {
      const { slotIndex, moveIndex, moveName } = action.payload;
      const newPokemons = [...state.pokemons];
      const newMoveset = [...newPokemons[slotIndex].moveset];
      newMoveset[moveIndex] = moveName;
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        moveset: newMoveset,
      };
      return {
        ...state,
        pokemons: newPokemons,
      };
    }

    case ACTIONS.SET_ITEM: {
      const { slotIndex, item, itemId } = action.payload;
      const newPokemons = [...state.pokemons];
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        item, // Nombre del item para la UI
        itemId, // ID del item para la base de datos
      };
      return {
        ...state,
        pokemons: newPokemons,
      };
    }

    case ACTIONS.SET_VIEW_MODE:
      return {
        ...state,
        viewMode: action.payload,
      };

    case ACTIONS.SET_SELECTED_SLOT:
      return {
        ...state,
        selectedSlot: action.payload,
      };

    case ACTIONS.SET_SELECTED_MOVE:
      return {
        ...state,
        selectedMove: action.payload,
      };

    case ACTIONS.SET_FLOW_STAGE:
      return {
        ...state,
        flowStage: action.payload,
      };

    case ACTIONS.SET_POKEMON_STATS: {
      const { slotIndex, evs, ivs, nature, stats } = action.payload;
      const newPokemons = [...state.pokemons];

      // Update the Pokémon with the new stat configuration
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        evs,
        ivs,
        nature,
        stats,
      };

      return {
        ...state,
        pokemons: newPokemons,
      };
    }

    case ACTIONS.UPDATE_POKEMON_STATS: {
      const { slotIndex, stats, evs, ivs, nature } = action.payload;
      const newPokemons = [...state.pokemons];
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        stats,
        evs,
        ivs,
        nature,
      };
      return {
        ...state,
        pokemons: newPokemons,
      };
    }

    case ACTIONS.UPDATE_TEAM_ANALYSIS: {
      return {
        ...state,
        teamAnalysis: action.payload,
      };
    }

    default:
      return state;
  }
}

// Crear el contexto
const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [state, dispatch] = useReducer(teamReducer, initialState);
  // Add a ref to track the latest selectedSlot
  const selectedSlotRef = useRef(state.selectedSlot);

  // Update ref whenever selectedSlot changes
  selectedSlotRef.current = state.selectedSlot;

  // Función auxiliar para avanzar al siguiente paso del flujo
  const advanceFlow = (currentStage, slotIndex) => {
    switch (currentStage) {
      case FLOW_STAGES.POKEMON:
        // Después de seleccionar un Pokémon, vamos al ítem
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.ITEM });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "items" });
        break;

      case FLOW_STAGES.ITEM:
        // CAMBIO: Después del ítem, vamos a la selección de habilidad
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.ABILITY });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "abilities" });
        break;

      case FLOW_STAGES.ABILITY:
        // Después de la habilidad, vamos al primer movimiento
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.MOVE_1 });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "moves" });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 0 },
        });
        break;

      case FLOW_STAGES.MOVE_1:
        // Avanzamos al segundo movimiento
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.MOVE_2 });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 1 },
        });
        break;

      case FLOW_STAGES.MOVE_2:
        // Avanzamos al tercer movimiento
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.MOVE_3 });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 2 },
        });
        break;

      case FLOW_STAGES.MOVE_3:
        // Avanzamos al cuarto movimiento
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.MOVE_4 });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 3 },
        });
        break;

      // In the advanceFlow function within TeamContext.jsx, modify the MOVE_4 case:
      case FLOW_STAGES.MOVE_4:
        // After the fourth move, go to stats configuration
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.STATS });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "stats" });
        break;

      // Add a new case for STATS:
      case FLOW_STAGES.STATS:
        // After stats, proceed to the next slot
        const nextSlot = (slotIndex + 1) % 6;
        dispatch({ type: ACTIONS.SET_SELECTED_SLOT, payload: nextSlot });
        dispatch({
          type: ACTIONS.SET_FLOW_STAGE,
          payload: FLOW_STAGES.POKEMON,
        });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "pokemon" });
        break;

      default:
        // Por defecto volvemos a la selección de Pokémon
        dispatch({
          type: ACTIONS.SET_FLOW_STAGE,
          payload: FLOW_STAGES.POKEMON,
        });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "pokemon" });
    }
  };

  // Crear acciones memorizadas para evitar recreaciones en cada renderizado
  const actions = useMemo(
    () => ({
      loadPokemonComplete: (slotIndex, pokemonData) => {
        dispatch({
          type: ACTIONS.LOAD_POKEMON_COMPLETE,
          payload: { slotIndex, pokemonData },
        });
      },

      setPokemon: (slotIndex, pokemon) =>
        dispatch({
          type: ACTIONS.SET_POKEMON,
          payload: { slotIndex, pokemon },
        }),

      setMove: (slotIndex, moveIndex, moveName) =>
        dispatch({
          type: ACTIONS.SET_MOVE,
          payload: { slotIndex, moveIndex, moveName },
        }),

      setItem: (slotIndex, item, itemId) => {
        console.log(`Setting item for slot ${slotIndex}: ${item} (ID: ${itemId})`);
        dispatch({
          type: ACTIONS.SET_ITEM,
          payload: {
            slotIndex,
            item: item, // Nombre del item para la UI
            itemId: itemId || item, // ID del item para la BD, usar item como fallback
          },
        });
      },

      setAbility: (slotIndex, ability, abilityId) => {
        console.log(`Setting ability for slot ${slotIndex}: ${ability} (ID: ${abilityId})`);
        dispatch({
          type: ACTIONS.SET_ABILITY,
          payload: {
            slotIndex,
            ability: ability, // Nombre de la habilidad para la UI
            abilityId: abilityId || ability, // ID de la habilidad para la BD, usar ability como fallback
          },
        });
      },

      setViewMode: (mode) => dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: mode }),

      setSelectedSlot: (slotIndex) => dispatch({ type: ACTIONS.SET_SELECTED_SLOT, payload: slotIndex }),

      setSelectedMove: (moveData) => dispatch({ type: ACTIONS.SET_SELECTED_MOVE, payload: moveData }),

      setFlowStage: (stage) => dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: stage }),

      // Función para seleccionar slot y cambiar vista en una sola acción
      selectSlot: (slotIndex) => {
        const isSameSlot = slotIndex === state.selectedSlot;
        console.log("Selecting slot index:", slotIndex);
        dispatch({ type: ACTIONS.SET_SELECTED_SLOT, payload: slotIndex });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 0 },
        });

        dispatch({
          type: ACTIONS.SET_FLOW_STAGE,
          payload: FLOW_STAGES.POKEMON,
        });

        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "pokemon" });
      },

      // Función para seleccionar Pokémon y avanzar al flujo de ítems
      selectPokemon: (pokemon) => {
        // Use the ref to get the latest selectedSlot
        const slotIndex = selectedSlotRef.current;
        console.log("Selecting Pokemon for slot index:", slotIndex);
        dispatch({
          type: ACTIONS.SET_POKEMON,
          payload: { slotIndex, pokemon },
        });

        // Avanzar al siguiente paso del flujo: selección de ítem
        advanceFlow(FLOW_STAGES.POKEMON, slotIndex);
      },

      // Método para manejar la selección de movimientos y la actualización del índice
      selectMove: (move) => {
        // Use the ref to get the latest selectedSlot
        const slotIndex = selectedSlotRef.current;
        const moveIndex = state.selectedMove.moveIndex;

        // Establecer el movimiento seleccionado
        // Asegurarnos de guardar el objeto de movimiento completo
        dispatch({
          type: ACTIONS.SET_MOVE,
          payload: { slotIndex, moveIndex, moveName: move },
        });

        // Determinar la etapa actual del flujo basado en el moveIndex
        let currentStage;
        switch (moveIndex) {
          case 0:
            currentStage = FLOW_STAGES.MOVE_1;
            break;
          case 1:
            currentStage = FLOW_STAGES.MOVE_2;
            break;
          case 2:
            currentStage = FLOW_STAGES.MOVE_3;
            break;
          case 3:
            currentStage = FLOW_STAGES.MOVE_4;
            break;
          default:
            currentStage = FLOW_STAGES.MOVE_1;
        }

        // Avanzar al siguiente paso del flujo
        advanceFlow(currentStage, slotIndex);
      },

      // Método para manejar la selección de items y avanzar al flujo de habilidades
      selectItem: (item) => {
        // Use the ref to get the latest selectedSlot
        const slotIndex = selectedSlotRef.current;

        // Establecer el item seleccionado
        dispatch({
          type: ACTIONS.SET_ITEM,
          payload: {
            slotIndex,
            item: item.name,
            itemId: item.key,
          },
        });

        // Avanzar al siguiente paso del flujo: habilidad
        advanceFlow(FLOW_STAGES.ITEM, slotIndex);
      },
      selectAbility: (abilityName, abilityId, abilityType) => {
        // Use the ref to get the latest selectedSlot
        const slotIndex = selectedSlotRef.current;

        // Ahora recibimos directamente el nombre y el ID separados
        dispatch({
          type: ACTIONS.SET_ABILITY,
          payload: {
            slotIndex,
            ability: abilityName, // Nombre legible para la UI
            abilityId: abilityId, // ID para la base de datos
          },
        });

        // Avanzar al siguiente paso del flujo: primer movimiento
        advanceFlow(FLOW_STAGES.ABILITY, slotIndex);
      },

      // Método para obtener el Pokémon seleccionado actualmente
      getSelectedPokemon: () => {
        return state.pokemons[state.selectedSlot];
      },

      // Método para avanzar manualmente al siguiente paso en el flujo
      advanceToNextStep: () => {
        advanceFlow(state.flowStage, selectedSlotRef.current);
      },

      setPokemonStats: (slotIndex, evs, ivs, nature, stats) => {
        dispatch({
          type: ACTIONS.SET_POKEMON_STATS,
          payload: { slotIndex, evs, ivs, nature, stats },
        });
      },

      updatePokemonStats: (slotIndex, stats, evs, ivs, nature) => {
        dispatch({
          type: ACTIONS.UPDATE_POKEMON_STATS,
          payload: { slotIndex, stats, evs, ivs, nature },
        });
      },

      advanceFromStats: () => {
        advanceFlow(FLOW_STAGES.STATS, selectedSlotRef.current);
      },

      updateTeamAnalysis: (analysis) => {
        dispatch({
          type: ACTIONS.UPDATE_TEAM_ANALYSIS,
          payload: analysis,
        });
      },
    }),
    [state.selectedMove.moveIndex, state.flowStage] // Removed state.selectedSlot dependency since we're using the ref
  );

  const value = {
    ...state,
    ...actions,
    FLOW_STAGES,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam debe ser usado dentro de un TeamProvider");
  }
  return context;
};
