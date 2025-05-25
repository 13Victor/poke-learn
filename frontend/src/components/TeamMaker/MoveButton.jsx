import React, { memo } from "react";

const MoveButton = memo(
  ({ move, index, isSelected, pokemonHasName, isMovesMode, onClick }) => {
    // Check if move is an object (with name and type) or just a string
    const moveName = typeof move === "object" ? move.name : move;
    const moveType = typeof move === "object" ? move.type : null;
    const moveTypeLower = moveType ? moveType.toLowerCase() : null;

    return (
      <button
        className={`moveInput ${isSelected ? "selected-move" : ""}`}
        onClick={onClick}
        style={{
          backgroundColor: moveType ? `var(--type-${moveTypeLower})` : `var(--white-smoke)`,
          textTransform: moveType ? "Uppercase" : "none",
          fontWeight: moveType ? "600" : "400",
          color: moveType ? "var(--white)" : "var(--black)",
        }}
      >
        {moveType && (
          <img
            src={`/assets/type-icons/${moveType}_icon.png`}
            alt={`${moveType} type`}
            className="move-type-icon-small"
          />
        )}
        <p>{moveName || `Move ${index + 1}`}</p>
      </button>
    );
  },
  (prevProps, nextProps) => {
    // If move is now an object, we need to compare differently
    if (typeof prevProps.move !== typeof nextProps.move) return false;

    // If they're both objects, compare name and type
    if (typeof prevProps.move === "object" && typeof nextProps.move === "object") {
      if (prevProps.move.name !== nextProps.move.name) return false;
      if (prevProps.move.type !== nextProps.move.type) return false;
    }
    // If they're strings, compare directly
    else if (prevProps.move !== nextProps.move) return false;

    if (prevProps.isSelected !== nextProps.isSelected) return false;
    if (prevProps.pokemonHasName !== nextProps.pokemonHasName) return false;
    if (prevProps.isMovesMode !== nextProps.isMovesMode) return false;
    return true;
  }
);

export default MoveButton;
