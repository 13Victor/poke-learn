import React, { memo } from "react";
import { useTeam } from "../../contexts/TeamContext";
import MoveButton from "./MoveButton";

const MoveSet = memo(
  ({ pokemon, moves, slotIndex }) => {
    const {
      selectedMove,
      setSelectedMove,
      setViewMode,
      viewMode,
      setSelectedSlot,
      setFlowStage,
      FLOW_STAGES,
      movesData,
    } = useTeam();

    const handleMoveClick = React.useCallback(
      (moveIndex, event) => {
        event.stopPropagation(); // Prevent propagation

        // If no Pokemon is selected, redirect to Pokemon selection
        if (!pokemon.name) {
          setViewMode("pokemon");
          setFlowStage(FLOW_STAGES.POKEMON);
        } else {
          // If there's a Pokemon, configure for move selection
          setViewMode("moves");

          // Set the flow stage according to the move index
          const flowStage = [FLOW_STAGES.MOVE_1, FLOW_STAGES.MOVE_2, FLOW_STAGES.MOVE_3, FLOW_STAGES.MOVE_4][moveIndex];

          setFlowStage(flowStage);
        }

        setSelectedSlot(slotIndex);
        setSelectedMove({ slot: slotIndex, moveIndex });
        console.log(`🎯 Selected move ${moveIndex + 1} of slot ${slotIndex}`);
      },
      [pokemon.name, setViewMode, setSelectedSlot, setSelectedMove, slotIndex, setFlowStage, FLOW_STAGES]
    );

    // Convert move string names to move objects if available in movesData
    const moveObjects = moves.map((move) => {
      // If we already have an object, return it
      if (typeof move === "object" && move !== null) {
        return move;
      }

      // If we have a string and it exists in movesData, return the full object
      if (typeof move === "string" && move && movesData && movesData[move]) {
        return movesData[move];
      }

      // Otherwise return the original string or an empty string if it's null/undefined
      return move || "";
    });

    return (
      <div className="moveInputsContainer">
        {moveObjects.map((move, index) => (
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
    // Check if Pokemon name changed
    if (prevProps.pokemon.name !== nextProps.pokemon.name) return false;

    // Check if any move changed
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
