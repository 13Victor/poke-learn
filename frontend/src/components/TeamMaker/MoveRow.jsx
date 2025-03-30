const MoveRow = ({ move, onClick }) => {
  return (
    <tr onClick={() => onClick(move)}>
      <td>{move.name}</td>
      <td>{move.type}</td>
      <td>{move.category}</td>
      <td>{move.basePower || "-"}</td>
      <td>{move.accuracy || "-"}</td>
      <td>{move.pp}</td>
    </tr>
  );
};

export default MoveRow;
