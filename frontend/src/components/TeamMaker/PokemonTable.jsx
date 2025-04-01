import React, { useState, useEffect, useCallback, memo } from "react";
import PokemonRow from "./PokemonRow";

const PokemonTable = memo(({ onPokemonSelect }) => {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetch("http://localhost:5000/data/availablePokemons")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo obtener la lista de Pokémon.");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setPokemons(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoizar la función de búsqueda para evitar recreaciones
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value.toLowerCase());
  }, []);

  // Filtrar los Pokémon basados en el término de búsqueda
  const filteredPokemon = useCallback(() => {
    if (!searchTerm) return pokemons;

    return pokemons.filter(
      (pokemon) =>
        pokemon.name.toLowerCase().includes(searchTerm) ||
        pokemon.types.some((type) => type.toLowerCase().includes(searchTerm)) ||
        pokemon.abilities.some((ability) =>
          ability.toLowerCase().includes(searchTerm)
        )
    );
  }, [pokemons, searchTerm]);

  // Memoizar el handler para evitar recreaciones
  const handleRowClick = useCallback(
    (pokemon) => {
      console.log("🔹 Pokémon seleccionado:", pokemon);
      onPokemonSelect(pokemon);
    },
    [onPokemonSelect]
  );

  if (loading) return <p>⏳ Cargando Pokémon...</p>;
  if (error) return <p>❌ Error: {error}</p>;

  return (
    <div>
      <h2>Lista de Pokémon</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar Pokémon, tipo, habilidad..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
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
            {filteredPokemon().map((pokemon) => (
              <PokemonRow
                key={pokemon.id || pokemon.name}
                pokemon={pokemon}
                onClick={handleRowClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default PokemonTable;
