import React, { useState, useEffect } from "react";

const MoveTable = () => {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/data/moves") // Asegúrate de que esta ruta devuelve los movimientos
      .then((res) => {
        if (!res.ok)
          throw new Error("No se pudo obtener la lista de movimientos.");
        return res.json();
      })
      .then((data) => {
        setMoves(Object.values(data)); // Convertir el objeto en un array
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>⏳ Cargando Movimientos...</p>;
  if (error) return <p>❌ Error: {error}</p>;

  return (
    <div>
      <h2>Lista de Movimientos</h2>

      <div className="table-container">
        <table border="1" className="pokemon-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Poder</th>
              <th>Precisión</th>
              <th>PP</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((move, index) => (
              <tr key={index}>
                <td>{move.name}</td>
                <td>{move.type}</td>
                <td>{move.category}</td>
                <td>{move.basePower || "-"}</td>
                <td>{move.accuracy || "-"}</td>
                <td>{move.pp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoveTable;
