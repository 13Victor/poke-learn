import { useState, useEffect } from "react";

const TeamBuilder = () => {
  const [pokedex, setPokedex] = useState({});
  const [formatsData, setFormatsData] = useState({});
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [banlist, setBanlist] = useState([]);

  // Formato fijo: [Gen 9] OU
  const selectedFormat = "[Gen 9] OU";

  useEffect(() => {
    // Cargar Pokédex
    fetch("http://localhost:5000/data/pokedex")
      .then((res) => res.json())
      .then((data) => setPokedex(data.Pokedex))
      .catch((err) => console.error("Error cargando Pokédex:", err));

    // Cargar datos de formatos (tiers y restricciones)
    fetch("http://localhost:5000/data/formats-data")
      .then((res) => res.json())
      .then((data) => setFormatsData(data.FormatsData))
      .catch((err) => console.error("Error cargando formatos de Pokémon:", err));

    // Cargar la banlist de OU
    fetch("http://localhost:5000/data/formats")
      .then((res) => res.json())
      .then((data) => {
        const format = data.Formats.find((f) => f.name === selectedFormat);
        if (format) {
          setBanlist(format.banlist || []);
        }
      })
      .catch((err) => console.error("Error cargando la banlist:", err));
  }, []);

  // Filtrar Pokémon según la banlist
  useEffect(() => {
    if (!pokedex || !formatsData) return;

    const allowedPokemon = Object.keys(pokedex).map((pokemon) => {
      const tier = formatsData[pokemon]?.tier || "Unknown"; // Obtener tier del Pokémon
      const isBanned = banlist.includes(pokemon) || banlist.includes(tier); // Verificar si está baneado

      return {
        name: pokemon,
        tier: isBanned ? `${tier}/illegal` : tier, // Si está baneado, marcarlo como ilegal
      };
    });

    setFilteredPokemon(allowedPokemon);
  }, [pokedex, formatsData, banlist]);

  return (
    <div>
      <h2>Pokémon disponibles en {selectedFormat}</h2>
      <ul>
        {filteredPokemon.map((pokemon) => (
          <li key={pokemon.name}>
            {pokemon.name} - {pokemon.tier}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamBuilder;
