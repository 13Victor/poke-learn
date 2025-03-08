import { useState, useEffect } from "react";

const TeamBuilder = () => {
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [pokedex, setPokedex] = useState({});
  const [formatsData, setFormatsData] = useState({});
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [banlist, setBanlist] = useState([]);

  useEffect(() => {
    // Cargar formatos
    fetch("http://localhost:5000/data/formats")
      .then((res) => res.json())
      .then((data) => setFormats(data.Formats))
      .catch((err) => console.error("Error cargando formatos:", err));

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
  }, []);

  // Cuando se elige un formato, obtener la banlist
  useEffect(() => {
    if (!selectedFormat || !formats) return;

    // Buscar el formato en la lista de formatos
    const format = formats.find((f) => f.name === selectedFormat);
    if (!format) return;

    setBanlist(format.banlist || []);
  }, [selectedFormat, formats]);

  // Filtrar Pokémon según la banlist
  useEffect(() => {
    if (!selectedFormat || !pokedex || !formatsData) return;

    // Obtener Pokémon jugables (excluyendo la banlist)
    const allowedPokemon = Object.keys(pokedex).filter((pokemon) => {
      return !banlist.includes(pokemon); // Excluir Pokémon baneados
    });

    setFilteredPokemon(allowedPokemon);
  }, [selectedFormat, pokedex, formatsData, banlist]);

  return (
    <div>
      <h2>Selecciona un Formato</h2>
      <select
        value={selectedFormat}
        onChange={(e) => setSelectedFormat(e.target.value)}
      >
        <option value="">-- Selecciona un formato --</option>
        {formats.map((format) => (
          <option key={format.name} value={format.name}>
            {format.name}
          </option>
        ))}
      </select>

      {selectedFormat && (
        <div>
          <h3>Pokémon disponibles</h3>
          <ul>
            {filteredPokemon.map((pokemon) => (
              <li key={pokemon}>{pokemon}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeamBuilder;
