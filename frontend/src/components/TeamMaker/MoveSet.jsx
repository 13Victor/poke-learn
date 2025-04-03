import React, { memo } from "react";
import { useTeam } from "../../TeamContext";
import MoveButton from "./MoveButton";

const MoveSet = memo(
  ({ pokemon, moves, slotIndex }) => {
    const {
      selectedMove,
      setSelectedMove,
      setViewMode,
      viewMode,
      setSelectedSlot,
    } = useTeam();

    const handleMoveClick = React.useCallback(
      (moveIndex, event) => {
        if (!pokemon.name) {
          setViewMode("pokemon");
        } else {
          setViewMode("moves");
        }
        event.stopPropagation(); // Evitar propagación
        setSelectedSlot(slotIndex);
        setSelectedMove({ slot: slotIndex, moveIndex });
        console.log(
          `🎯 Seleccionado movimiento ${moveIndex + 1} del slot ${slotIndex}`
        );
      },
      [pokemon.name, setViewMode, setSelectedSlot, setSelectedMove, slotIndex]
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
