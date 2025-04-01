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
      image: "0000.png",
      types: [],
      moveset: ["", "", "", ""],
    })),
  viewMode: "pokemon",
  selectedSlot: 0,
  selectedMove: { slot: 0, moveIndex: 0 },
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
      const { slotIndex, item } = action.payload;
      const newPokemons = [...state.pokemons];
      newPokemons[slotIndex] = {
        ...newPokemons[slotIndex],
        item,
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

    default:
      return state;
  }
}

// Crear el contexto
const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [state, dispatch] = useReducer(teamReducer, initialState);

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

      setItem: (slotIndex, item) =>
        dispatch({ type: ACTIONS.SET_ITEM, payload: { slotIndex, item } }),

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

      // Función para seleccionar slot y cambiar vista en una sola acción
      selectSlot: (slotIndex) => {
        dispatch({ type: ACTIONS.SET_SELECTED_SLOT, payload: slotIndex });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 0 },
        });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "pokemon" });
      },

      // Función para seleccionar Pokémon y preparar movimientos
      selectPokemon: (slotIndex, pokemon) => {
        dispatch({
          type: ACTIONS.SET_POKEMON,
          payload: { slotIndex, pokemon },
        });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 0 },
        });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "moves" });
      },
    }),
    []
  );

  const value = { ...state, ...actions };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam debe ser usado dentro de un TeamProvider");
  }
  return context;
};
