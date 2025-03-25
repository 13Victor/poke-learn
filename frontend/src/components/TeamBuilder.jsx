import { useState, useEffect } from "react";

const TeamBuilder = () => {
  const [filteredPokemon, setFilteredPokemon] = useState([]);

  useEffect(() => {
    console.log("📡 Fetching Pokédex...");
    fetch("http://localhost:5000/data/availablePokemons")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Pokémon cargados:", data);
        setFilteredPokemon(data);
      })
      .catch((err) => console.error("❌ Error cargando Pokédex:", err));
  }, []);

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
            <tr key={pokemon.name}>
              <td>{pokemon.name}</td>
              <td>{pokemon.tier}</td>
              <td>{pokemon.types}</td>
              <td>{pokemon.abilities}</td>
              <td>{pokemon.stats.hp}</td>
              <td>{pokemon.stats.atk}</td>
              <td>{pokemon.stats.def}</td>
              <td>{pokemon.stats.spa}</td>
              <td>{pokemon.stats.spd}</td>
              <td>{pokemon.stats.spe}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamBuilder;
