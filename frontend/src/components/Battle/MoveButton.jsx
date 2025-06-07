// src/components/Battle/MoveButton.jsx
import React, { useState, useEffect } from "react";
import apiService from "../../services/apiService";

// Move data cache to avoid repeated API calls
const moveDataCache = new Map();

export function MoveButton({ move, index, disabled, isProcessing, onExecute }) {
  const [moveData, setMoveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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

  // Function to format accuracy display
  const formatAccuracy = (accuracy) => {
    if (accuracy === true) return "—"; // Moves that never miss
    if (accuracy === null || accuracy === undefined) return "—";
    return `${accuracy}%`;
  };

  // Function to format base power display
  const formatBasePower = (basePower) => {
    if (!basePower || basePower === 0) return "—";
    return basePower.toString();
  };

  // Function to format priority display
  const formatPriority = (priority) => {
    if (priority === 0) return "0";
    if (priority > 0) return `+${priority}`;
    return priority.toString();
  };

  // Function to format category with emoji
  const formatCategory = (category) => {
    return (
      <img
        src={`/assets/move-category/${category}.png`}
        title={category}
        className={`category-icon category-${category.toLowerCase()}`}
      />
    );
  };

  // Create tooltip content
  const renderTooltip = () => {
    if (!moveData || loading) return null;

    return (
      <div className="move-tooltip">
        <div className="move-tooltip-header">
          <h5 className="move-tooltip-name">{moveData.name}</h5>
          <span className="stat-value">{formatCategory(moveData.category)}</span>
        </div>

        <div className="move-tooltip-stats">
          <div className="move-stat">
            <span className="stat-label">Power:</span>
            <span className="stat-value">{formatBasePower(moveData.basePower)}</span>
          </div>

          <div className="move-stat">
            <span className="stat-label">Accuracy:</span>
            <span className="stat-value">{formatAccuracy(moveData.accuracy)}</span>
          </div>

          <div className="move-stat type">
            <img className={`move-tooltip-type`} src={`/assets/type-icons/${moveType}_banner.png`} alt="" srcset="" />
          </div>

          <div className="move-stat">
            <span className="stat-label">PP:</span>
            <span className="stat-value">{moveData.pp || "—"}</span>
          </div>

          <div className="move-stat">
            <span className="stat-label">Priority:</span>
            <span className="stat-value">{formatPriority(moveData.priority)}</span>
          </div>
        </div>

        {moveData.shortDesc && <div className="move-tooltip-description">{moveData.shortDesc}</div>}
      </div>
    );
  };

  return (
    <div
      className="move-button-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => onExecute(`>p1 move ${index + 1}`)}
        disabled={isDisabled}
        className={`moveInput ${isDisabled ? "disabled" : ""}`}
        style={{
          backgroundColor: moveType ? `var(--type-${moveTypeLower})` : `var(--white-smoke)`,
          textTransform: moveType ? "uppercase" : "none",
          fontWeight: moveType ? "600" : "400",
        }}
        title={
          isProcessing
            ? "Procesando comando anterior..."
            : disabled
            ? "Debes esperar a que la CPU cambie de Pokémon"
            : isDisabled
            ? "Movimiento deshabilitado"
            : "" // Remove basic title since we have detailed tooltip
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

      {/* Tooltip */}
      {showTooltip && moveData && !loading && <div className="move-tooltip-wrapper">{renderTooltip()}</div>}
    </div>
  );
}
