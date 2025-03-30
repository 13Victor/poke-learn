import { useViewMode } from "../../ViewModeContext";

const MoveSet = ({ moves }) => {
  console.log(moves);

  const { selectedSlot, selectedMoveIndex, setSelectedMoveIndex } =
    useViewMode();

  const handleMoveClick = (index, event) => {
    event.stopPropagation(); // Evita que el clic llegue al `PokeSlot`
    setSelectedMoveIndex(index);
    console.log(
      `🎯 Seleccionado movimiento ${index + 1} del slot ${selectedSlot}`
    );
  };

  return (
    <div className="moveInputsContainer">
      {moves.map((move, index) => (
        <button
          key={index}
          className={`moveInput ${
            selectedMoveIndex === index ? "selected-move" : ""
          }`}
          onClick={(event) => handleMoveClick(index, event)}
        >
          {move || `Move ${index + 1}`}{" "}
          {/* Si el movimiento está vacío, muestra "Move X" */}
        </button>
      ))}
    </div>
  );
};

export default MoveSet;
