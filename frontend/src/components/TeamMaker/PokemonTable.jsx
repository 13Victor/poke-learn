import React, { useState, useEffect } from "react";
import PokemonRow from "./PokemonRow";

const PokemonTable = ({ onPokemonSelect }) => {
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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
    onPokemonSelect(pokemon);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedData = [...filteredPokemon].sort((a, b) => {
      let valueA, valueB;

      if (["hp", "atk", "def", "spa", "spd", "spe"].includes(key)) {
        valueA = a.stats[key];
        valueB = b.stats[key];
      } else {
        valueA = a[key];
        valueB = b[key];
      }

      if (typeof valueA === "string") valueA = valueA.toLowerCase();
      if (typeof valueB === "string") valueB = valueB.toLowerCase();

      if (valueA < valueB) return direction === "asc" ? -1 : 1;
      if (valueA > valueB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredPokemon(sortedData);
  };

  if (loading) return <p>⏳ Cargando Pokémon...</p>;
  if (error) return <p>❌ Error: {error}</p>;

  return (
    <div>
      <h2>Lista de Pokémon</h2>
      <table border="1" className="pokemon-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>#</th>
            <th onClick={() => handleSort("name")}>Nombre</th>
            <th onClick={() => handleSort("tier")}>Tier</th>
            <th onClick={() => handleSort("types")}>Tipos</th>
            <th onClick={() => handleSort("abilities")}>Habilidades</th>
            <th onClick={() => handleSort("hp")}>HP</th>
            <th onClick={() => handleSort("atk")}>ATK</th>
            <th onClick={() => handleSort("def")}>DEF</th>
            <th onClick={() => handleSort("spa")}>SPA</th>
            <th onClick={() => handleSort("spd")}>SPD</th>
            <th onClick={() => handleSort("spe")}>SPE</th>
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
  );
};

export default PokemonTable;
