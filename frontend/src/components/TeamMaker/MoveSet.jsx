import React, { memo } from "react";
import { useTeam } from "../../TeamContext";

const MoveSet = memo(
  ({ pokemon, moves, slotIndex }) => {
    const {
      selectedMove,
      setSelectedMove,
      setViewMode,
      viewMode,
      setSelectedSlot,
    } = useTeam();

    const handleMoveClick = (moveIndex, event) => {
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
    };

    return (
      <div className="moveInputsContainer">
        {moves.map((move, index) => (
          <button
            key={index}
            className={`moveInput ${
              selectedMove.slot === slotIndex &&
              selectedMove.moveIndex === index &&
              pokemon.name &&
              viewMode === "moves"
                ? "selected-move"
                : ""
            }`}
            onClick={(event) => handleMoveClick(index, event)}
          >
            {move || `Move ${index + 1}`}
          </button>
        ))}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Comparar los arrays de movimientos para evitar renders innecesarios
    const prevMoves = prevProps.moves || [];
    const nextMoves = nextProps.moves || [];

    if (prevMoves.length !== nextMoves.length) return false;

    // Verificar si el nombre del Pokémon cambió
    if (prevProps.pokemon.name !== nextProps.pokemon.name) return false;

    // Verificar si algún movimiento cambió
    for (let i = 0; i < prevMoves.length; i++) {
      if (prevMoves[i] !== nextMoves[i]) return false;
    }

    return true;
  }
);

export default MoveSet;
