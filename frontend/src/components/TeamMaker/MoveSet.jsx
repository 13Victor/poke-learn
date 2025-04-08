import React, { memo } from "react";
import { useTeam } from "../../contexts/TeamContext";
import MoveButton from "./MoveButton";

const MoveSet = memo(
  ({ pokemon, moves, slotIndex }) => {
    const { selectedMove, setSelectedMove, setViewMode, viewMode, setSelectedSlot, setFlowStage, FLOW_STAGES } =
      useTeam();

    const handleMoveClick = React.useCallback(
      (moveIndex, event) => {
        event.stopPropagation(); // Evitar propagación

        // Si no hay un Pokémon seleccionado, redirigir a selección de Pokémon
        if (!pokemon.name) {
          setViewMode("pokemon");
          setFlowStage(FLOW_STAGES.POKEMON);
        } else {
          // Si hay Pokémon, configurar para selección de movimiento
          setViewMode("moves");

          // Establecer la etapa del flujo según el índice del movimiento
          const flowStage = [FLOW_STAGES.MOVE_1, FLOW_STAGES.MOVE_2, FLOW_STAGES.MOVE_3, FLOW_STAGES.MOVE_4][moveIndex];

          setFlowStage(flowStage);
        }

        setSelectedSlot(slotIndex);
        setSelectedMove({ slot: slotIndex, moveIndex });
        console.log(`🎯 Seleccionado movimiento ${moveIndex + 1} del slot ${slotIndex}`);
      },
      [pokemon.name, setViewMode, setSelectedSlot, setSelectedMove, slotIndex, setFlowStage, FLOW_STAGES]
    );

    return (
      <div className="moveInputsContainer">
        {moves.map((move, index) => (
          <MoveButton
            key={index}
            move={move}
            index={index}
            isSelected={
              selectedMove.slot === slotIndex &&
              selectedMove.moveIndex === index &&
              pokemon.name &&
              viewMode === "moves"
            }
            pokemonHasName={!!pokemon.name}
            isMovesMode={viewMode === "moves"}
            onClick={(event) => handleMoveClick(index, event)}
          />
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Verificar si el nombre del Pokémon cambió
    if (prevProps.pokemon.name !== nextProps.pokemon.name) return false;

    // Verificar si algún movimiento cambió
    const prevMoves = prevProps.moves || [];
    const nextMoves = nextProps.moves || [];

    if (prevMoves.length !== nextMoves.length) return false;

    for (let i = 0; i < prevMoves.length; i++) {
      if (prevMoves[i] !== nextMoves[i]) return false;
    }

    return true;
  }
);

export default MoveSet;
