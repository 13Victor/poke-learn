import React, { useState, useEffect } from "react";
import PokemonRow from "./PokemonRow";

const PokemonTable = () => {
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  useEffect(() => {
    console.log("📡 Fetching Pokédex...");
    fetch("http://localhost:5000/data/availablePokemons")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo obtener la lista de Pokémon.");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Pokémon cargados:", data);
        setFilteredPokemon(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error cargando Pokédex:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleRowClick = (pokemonName) => {
    console.log("🔍 Pokémon seleccionado:", pokemonName);
    setSelectedPokemon(pokemonName);
  };

  if (loading) return <p>⏳ Cargando Pokémon...</p>;
  if (error) return <p>❌ Error: {error}</p>;

  return (
    <div>
      <h2>Lista de Pokémon</h2>
      <table border="1">
        <thead>
          <tr>
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
              key={pokemon.num}
              pokemon={pokemon}
              onClick={handleRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PokemonTable;
