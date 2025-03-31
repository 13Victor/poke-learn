import React, { useState, useEffect } from "react";
import MoveRow from "./MoveRow";

const MoveTable = ({ onMoveSelect, selectedPokemon }) => {
  const [moves, setMoves] = useState({});
  const [learnsets, setLearnsets] = useState({});
  const [filteredMoves, setFilteredMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cargar datos de movimientos y learnsets
    Promise.all([
      fetch("http://localhost:5000/data/moves").then((res) => res.json()),
      fetch("http://localhost:5000/data/learnsets").then((res) => res.json()),
    ])
      .then(([movesData, learnsetsData]) => {
        setMoves(movesData);
        setLearnsets(learnsetsData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filtrar los movimientos basados en el Pokémon seleccionado
  useEffect(() => {
    if (!selectedPokemon || !selectedPokemon.id) {
      setFilteredMoves([]);
      return;
    }

    // Intenta obtener el learnset del Pokémon seleccionado o de su changesFrom si no tiene
    const pokemonLearnset =
      learnsets[selectedPokemon.id]?.learnset ||
      learnsets[selectedPokemon.changesFrom]?.learnset ||
      {};

    const moveNames = Object.keys(pokemonLearnset);
    const filtered = moveNames.map((move) => moves[move]).filter(Boolean);
    setFilteredMoves(filtered);
  }, [selectedPokemon, learnsets, moves]);

  const handleRowClick = (move) => {
    onMoveSelect(move);
  };

  if (loading) return <p>⏳ Cargando Movimientos...</p>;
  if (error) return <p>❌ Error: {error}</p>;

  return (
    <div>
      <h2>Movimientos disponibles</h2>

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
            {filteredMoves.length > 0 ? (
              filteredMoves.map((move) => (
                <MoveRow
                  key={move.name}
                  move={move}
                  onClick={() => handleRowClick(move)}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6">❌ No hay movimientos disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MoveTable;
