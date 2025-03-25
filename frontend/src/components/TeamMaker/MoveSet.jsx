const MoveSet = ({ moves, onChange }) => {
  return (
    <div className="moveInputsContainer">
      {Object.keys(moves).map((move, index) => (
        <input
          key={index}
          type="text"
          className="moveInput"
          name={move}
          value={moves[move]}
          onChange={onChange}
        />
      ))}
    </div>
  );
};

export default MoveSet;
