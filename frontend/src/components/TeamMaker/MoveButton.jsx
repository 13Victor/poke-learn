import React, { memo } from "react";

const MoveButton = memo(
  ({ move, index, isSelected, pokemonHasName, isMovesMode, onClick }) => {
    return (
      <button
        className={`moveInput ${isSelected ? "selected-move" : ""}`}
        onClick={onClick}
      >
        {move || `Move ${index + 1}`}
      </button>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.move !== nextProps.move) return false;
    if (prevProps.isSelected !== nextProps.isSelected) return false;
    if (prevProps.pokemonHasName !== nextProps.pokemonHasName) return false;
    if (prevProps.isMovesMode !== nextProps.isMovesMode) return false;
    return true;
  }
);

export default MoveButton;
