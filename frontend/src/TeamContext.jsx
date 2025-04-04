import React, { createContext, useContext, useReducer, useMemo } from "react";

// Definir acciones para el reducer
const ACTIONS = {
  SET_POKEMON: "SET_POKEMON",
  SET_MOVE: "SET_MOVE",
  SET_ITEM: "SET_ITEM",
  SET_ABILITY: "SET_ABILITY",
  SET_VIEW_MODE: "SET_VIEW_MODE",
  SET_SELECTED_SLOT: "SET_SELECTED_SLOT",
  SET_SELECTED_MOVE: "SET_SELECTED_MOVE",
  SET_FLOW_STAGE: "SET_FLOW_STAGE", // Nueva acción para el flujo de trabajo
};

// Etapas del flujo de trabajo
const FLOW_STAGES = {
  POKEMON: "pokemon",
  ITEM: "item",
  ABILITY: "ability",
  MOVE_1: "move_1",
  MOVE_2: "move_2",
  MOVE_3: "move_3",
  MOVE_4: "move_4",
};

// Estado inicial
const initialState = {
  // Los Pokémon del equipo se manejan como objetos independientes
  pokemons: Array(6)
    .fill()
    .map(() => ({
      name: "",
      level: 100,
      item: "",
      ability: "",
      image: "0000.webp",
      types: [],
      moveset: ["", "", "", ""],
      itemSpriteNum: null, // Added to track item sprite
    })),
  viewMode: "pokemon", // Can now be "pokemon", "moves", or "items"
  selectedSlot: 0,
  selectedMove: { slot: 0, moveIndex: 0 },
  flowStage: FLOW_STAGES.POKEMON, // Nueva propiedad para seguir el flujo
};

// Reducer para manejar las actualizaciones de estado
function teamReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_POKEMON: {
      const { slotIndex, pokemon } = action.payload;
      const newPokemons = [...state.pokemons];
      // Preservar el moveset si ya existe
      const currentMoveset = newPokemons[slotIndex].moveset || ["", "", "", ""];
      newPokemons[slotIndex] = {
        ...pokemon,
        moveset: currentMoveset,
        item: newPokemons[slotIndex].item || "",
        itemSpriteNum: newPokemons[slotIndex].itemSpriteNum || null,
        ability: newPokemons[slotIndex].ability || "",
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
      const { slotIndex, item, spriteNum } = action.payload;
      const newPokemons = [...state.pokemons];
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        item,
        itemSpriteNum: spriteNum,
      };
      return {
        ...state,
        pokemons: newPokemons,
      };
    }

    case ACTIONS.SET_ABILITY: {
      const { slotIndex, ability } = action.payload;
      const newPokemons = [...state.pokemons];
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        ability,
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

    default:
      return state;
  }
}

// Crear el contexto
const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [state, dispatch] = useReducer(teamReducer, initialState);

  // Función auxiliar para avanzar al siguiente paso del flujo
  const advanceFlow = (currentStage, slotIndex) => {
    switch (currentStage) {
      case FLOW_STAGES.POKEMON:
        // Después de seleccionar un Pokémon, vamos al ítem
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.ITEM });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "items" });
        break;

      case FLOW_STAGES.ITEM:
        // Después del ítem, vamos al primer movimiento
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

      case FLOW_STAGES.MOVE_4:
        // Después del último movimiento, avanzamos al siguiente slot
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

      setItem: (slotIndex, item, spriteNum) =>
        dispatch({
          type: ACTIONS.SET_ITEM,
          payload: { slotIndex, item, spriteNum },
        }),

      setAbility: (slotIndex, ability) =>
        dispatch({
          type: ACTIONS.SET_ABILITY,
          payload: { slotIndex, ability },
        }),

      setViewMode: (mode) =>
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: mode }),

      setSelectedSlot: (slotIndex) =>
        dispatch({ type: ACTIONS.SET_SELECTED_SLOT, payload: slotIndex }),

      setSelectedMove: (moveData) =>
        dispatch({ type: ACTIONS.SET_SELECTED_MOVE, payload: moveData }),

      setFlowStage: (stage) =>
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: stage }),

      // Función para seleccionar slot y cambiar vista en una sola acción
      selectSlot: (slotIndex) => {
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
      selectPokemon: (slotIndex, pokemon) => {
        dispatch({
          type: ACTIONS.SET_POKEMON,
          payload: { slotIndex, pokemon },
        });

        // Avanzar al siguiente paso del flujo: selección de ítem
        advanceFlow(FLOW_STAGES.POKEMON, slotIndex);
      },

      // Método para manejar la selección de movimientos y la actualización del índice
      selectMove: (move) => {
        const slotIndex = state.selectedSlot;
        const moveIndex = state.selectedMove.moveIndex;

        // Establecer el movimiento seleccionado
        dispatch({
          type: ACTIONS.SET_MOVE,
          payload: { slotIndex, moveIndex, moveName: move.name },
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

      // Método para manejar la selección de items y avanzar al flujo de movimientos
      selectItem: (item) => {
        const slotIndex = state.selectedSlot;

        // Establecer el item seleccionado
        dispatch({
          type: ACTIONS.SET_ITEM,
          payload: {
            slotIndex,
            item: item.name,
            spriteNum: item.spritenum,
          },
        });

        // Avanzar al siguiente paso del flujo: primer movimiento
        advanceFlow(FLOW_STAGES.ITEM, slotIndex);
      },

      // Método para obtener el Pokémon seleccionado actualmente
      getSelectedPokemon: () => {
        return state.pokemons[state.selectedSlot];
      },

      // Método para avanzar manualmente al siguiente paso en el flujo
      advanceToNextStep: () => {
        advanceFlow(state.flowStage, state.selectedSlot);
      },
    }),
    [state.selectedSlot, state.selectedMove.moveIndex, state.flowStage]
  );

  const value = {
    ...state,
    ...actions,
    FLOW_STAGES, // Exportamos las constantes para poder usarlas en otros componentes
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
