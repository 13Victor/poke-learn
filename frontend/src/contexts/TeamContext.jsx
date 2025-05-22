import React, { createContext, useContext, useReducer, useMemo, useRef } from "react";
import { calculateBaseDisplayStats } from "../utils/pokemonStatsCalculator";

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
  RESET_TEAM: "RESET_TEAM",
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
    case ACTIONS.RESET_TEAM: {
      return {
        ...initialState,
      };
    }
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

      // Calcular stats iniciales usando la utilidad centralizada
      const initialStats = calculateBaseDisplayStats(pokemon.baseStats, 100);

      newPokemons[slotIndex] = {
        ...pokemon,
        level: 100,
        moveset: ["", "", "", ""],
        item: "",
        itemId: "",
        ability: "",
        abilityId: "",
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
        nature: "Hardy",
        stats: initialStats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
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
        ability,
        abilityId,
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
        item,
        itemId,
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
  const selectedSlotRef = useRef(state.selectedSlot);

  selectedSlotRef.current = state.selectedSlot;

  // Función auxiliar para avanzar al siguiente paso del flujo
  const advanceFlow = (currentStage, slotIndex) => {
    switch (currentStage) {
      case FLOW_STAGES.POKEMON:
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.ITEM });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "items" });
        break;

      case FLOW_STAGES.ITEM:
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.ABILITY });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "abilities" });
        break;

      case FLOW_STAGES.ABILITY:
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.MOVE_1 });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "moves" });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 0 },
        });
        break;

      case FLOW_STAGES.MOVE_1:
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.MOVE_2 });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 1 },
        });
        break;

      case FLOW_STAGES.MOVE_2:
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.MOVE_3 });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 2 },
        });
        break;

      case FLOW_STAGES.MOVE_3:
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.MOVE_4 });
        dispatch({
          type: ACTIONS.SET_SELECTED_MOVE,
          payload: { slot: slotIndex, moveIndex: 3 },
        });
        break;

      case FLOW_STAGES.MOVE_4:
        dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: FLOW_STAGES.STATS });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "stats" });
        break;

      case FLOW_STAGES.STATS:
        const nextSlot = (slotIndex + 1) % 6;
        dispatch({ type: ACTIONS.SET_SELECTED_SLOT, payload: nextSlot });
        dispatch({
          type: ACTIONS.SET_FLOW_STAGE,
          payload: FLOW_STAGES.POKEMON,
        });
        dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: "pokemon" });
        break;

      default:
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
      resetTeam: () => {
        dispatch({
          type: ACTIONS.RESET_TEAM,
        });
      },
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

      setMove: (slotIndex, moveIndex, move) => {
        const moveName = typeof move === "object" ? move.name : move;

        dispatch({
          type: ACTIONS.SET_MOVE,
          payload: { slotIndex, moveIndex, moveName: move },
        });
      },

      setItem: (slotIndex, item, itemId) => {
        console.log(`Setting item for slot ${slotIndex}: ${item} (ID: ${itemId})`);
        dispatch({
          type: ACTIONS.SET_ITEM,
          payload: {
            slotIndex,
            item: item,
            itemId: itemId || item,
          },
        });
      },

      setAbility: (slotIndex, ability, abilityId) => {
        console.log(`Setting ability for slot ${slotIndex}: ${ability} (ID: ${abilityId})`);
        dispatch({
          type: ACTIONS.SET_ABILITY,
          payload: {
            slotIndex,
            ability: ability,
            abilityId: abilityId || ability,
          },
        });
      },

      setViewMode: (mode) => dispatch({ type: ACTIONS.SET_VIEW_MODE, payload: mode }),

      setSelectedSlot: (slotIndex) => dispatch({ type: ACTIONS.SET_SELECTED_SLOT, payload: slotIndex }),

      setSelectedMove: (moveData) => dispatch({ type: ACTIONS.SET_SELECTED_MOVE, payload: moveData }),

      setFlowStage: (stage) => dispatch({ type: ACTIONS.SET_FLOW_STAGE, payload: stage }),

      selectSlot: (slotIndex) => {
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

      selectPokemon: (pokemon) => {
        const slotIndex = selectedSlotRef.current;
        console.log("Selecting Pokemon for slot index:", slotIndex);
        dispatch({
          type: ACTIONS.SET_POKEMON,
          payload: { slotIndex, pokemon },
        });

        advanceFlow(FLOW_STAGES.POKEMON, slotIndex);
      },

      selectMove: (move) => {
        const slotIndex = selectedSlotRef.current;
        const moveIndex = state.selectedMove.moveIndex;

        dispatch({
          type: ACTIONS.SET_MOVE,
          payload: { slotIndex, moveIndex, moveName: move },
        });

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

        advanceFlow(currentStage, slotIndex);
      },

      selectItem: (item) => {
        const slotIndex = selectedSlotRef.current;

        dispatch({
          type: ACTIONS.SET_ITEM,
          payload: {
            slotIndex,
            item: item.name,
            itemId: item.key,
          },
        });

        advanceFlow(FLOW_STAGES.ITEM, slotIndex);
      },
      selectAbility: (abilityName, abilityId, abilityType) => {
        const slotIndex = selectedSlotRef.current;

        dispatch({
          type: ACTIONS.SET_ABILITY,
          payload: {
            slotIndex,
            ability: abilityName,
            abilityId: abilityId,
          },
        });

        advanceFlow(FLOW_STAGES.ABILITY, slotIndex);
      },

      getSelectedPokemon: () => {
        return state.pokemons[state.selectedSlot];
      },

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
    [state.selectedMove.moveIndex, state.flowStage]
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
