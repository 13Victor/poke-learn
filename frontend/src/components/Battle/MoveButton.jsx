// src/components/Battle/MoveButton.jsx
import React, { useState, useEffect } from "react";
import apiService from "../../services/apiService";

// Move data cache to avoid repeated API calls
const moveDataCache = new Map();

export function MoveButton({ move, index, disabled, isProcessing, onExecute }) {
  const [moveData, setMoveData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Extract move name from the move object
  const moveName = move?.move || move?.name || `Move ${index + 1}`;
  const isDisabled = move?.disabled || disabled;

  // Fetch move data when component mounts or move changes
  useEffect(() => {
    const fetchMoveData = async () => {
      if (!moveName || moveName.includes("Move ")) {
        setMoveData(null);
        return;
      }

      // Check cache first
      if (moveDataCache.has(moveName)) {
        setMoveData(moveDataCache.get(moveName));
        return;
      }

      setLoading(true);
      try {
        const response = await apiService.getMoveByName(moveName);
        const data = response.data;

        // Cache the result
        moveDataCache.set(moveName, data);
        setMoveData(data);
      } catch (error) {
        console.error("Error fetching move data:", error);
        setMoveData(null);
        // Cache null result to avoid repeated failed requests
        moveDataCache.set(moveName, null);
      } finally {
        setLoading(false);
      }
    };

    fetchMoveData();
  }, [moveName]);

  const moveType = moveData?.type;
  const moveTypeLower = moveType ? moveType.toLowerCase() : null;

  return (
    <button
      onClick={() => onExecute(`>p1 move ${index + 1}`)}
      disabled={isDisabled}
      className={`moveInput ${isDisabled ? "disabled" : ""}`}
      style={{
        backgroundColor: moveType ? `var(--type-${moveTypeLower})` : `var(--white-smoke)`,
        textTransform: moveType ? "uppercase" : "none",
        fontWeight: moveType ? "600" : "400",
        color: isDisabled ? "var(--danger)" : moveType ? "var(--white)" : "var(--black)",
        opacity: loading ? 0.7 : 1,
      }}
      title={
        isProcessing
          ? "Procesando comando anterior..."
          : disabled
          ? "Debes esperar a que la CPU cambie de Pokémon"
          : isDisabled
          ? "Movimiento deshabilitado"
          : moveData?.shortDesc || moveName
      }
    >
      {moveType && !loading && (
        <img
          src={`/assets/type-icons/${moveType}_icon.png`}
          alt={`${moveType} type`}
          className="move-type-icon-small"
          onError={(e) => {
            // Hide image if type icon doesn't exist
            e.target.style.display = "none";
          }}
        />
      )}
      <p>{loading ? "..." : moveName}</p>
    </button>
  );
}
