import { useViewMode } from "../../ViewModeContext";
import { useTeam } from "../../TeamContext";

const MoveSet = ({ pokemon, moves, slotIndex }) => {
  const { selectedSlot, setSelectedSlot } = useTeam();
  const { selectedMove, setSelectedMove, setViewMode } = useViewMode();

  const handleMoveClick = (moveIndex, event) => {
    if (!pokemon.name) {
      setViewMode("pokemon"); // Cambia el modo de vista a "pokemon"
    } else {
      setViewMode("moves"); // Cambia el modo de vista a "moveset"
    }

    event.stopPropagation(); // Evita que el evento se propague

    setSelectedSlot(slotIndex);
    const nextMoveIndex = moveIndex < 3 ? moveIndex : 3;
    setSelectedMove({ slot: slotIndex, moveIndex: nextMoveIndex });

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
            pokemon.name
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
};

export default MoveSet;
