import React, { useState, useEffect } from "react";
import PokemonRow from "./PokemonRow";
import { useTeam } from "../../TeamContext";

const PokemonTable = ({ onPokemonSelect }) => {
  const { setViewMode } = useTeam(); // Contexto para cambiar la vista
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/data/availablePokemons")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo obtener la lista de Pokémon.");
        return res.json();
      })
      .then((data) => {
        setFilteredPokemon(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleRowClick = (pokemon) => {
    console.log("🔹 Pokémon seleccionado:", pokemon);
    onPokemonSelect(pokemon); // Llamamos a la función onPokemonSelect pasada desde TeamMaker
    setViewMode("moves"); // Cambia la vista a movimientos
  };

  if (loading) return <p>⏳ Cargando Pokémon...</p>;
  if (error) return <p>❌ Error: {error}</p>;

  return (
    <div>
      <h2>Lista de Pokémon</h2>
      <div className="table-container">
        <table border="1" className="pokemon-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Tier</th>
              <th>Tipos</th>
              <th>Habilidades</th>
              <th>HP</th>
              <th>ATK</th>
              <th>DEF</th>
              <th>SPA</th>
              <th>SPD</th>
              <th>SPE</th>
            </tr>
          </thead>
          <tbody>
            {filteredPokemon.map((pokemon) => (
              <PokemonRow
                key={pokemon.name}
                pokemon={pokemon}
                onClick={() => handleRowClick(pokemon)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PokemonTable;
