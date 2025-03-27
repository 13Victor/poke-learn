import { useViewMode } from "../../ViewModeContext";

const MoveSet = ({ moves }) => {
  const { setViewMode } = useViewMode(); // Obtenemos el setter global
  const { viewMode } = useViewMode(); // Obtenemos el getter global

  const handleMoveClick = (event) => {
    event.stopPropagation(); // 🔥 Evita que el clic llegue a PokeSlot
    console.log("⚡ Cambiando a vista de movimientos");
    setViewMode("moves");
    console.log(viewMode);
  };

  return (
    <div className="moveInputsContainer">
      {Object.keys(moves).map((move, index) => (
        <button key={index} className="moveInput" onClick={handleMoveClick}>
          {move || `Move ${index + 1}`}
        </button>
      ))}
    </div>
  );
};

export default MoveSet;
