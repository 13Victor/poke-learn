import { useState, useEffect } from "react";

const TeamBuilder = () => {
  const [pokedex, setPokedex] = useState({});
  const [formatsData, setFormatsData] = useState({});
  const [filteredPokemon, setFilteredPokemon] = useState([]);

  useEffect(() => {
    console.log("📡 Fetching Pokédex...");
    fetch("http://localhost:5000/data/pokedex")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Pokédex cargada:", data);
        setPokedex(data.Pokedex);
      })
      .catch((err) => console.error("❌ Error cargando Pokédex:", err));

    console.log("📡 Fetching Formats Data...");
    fetch("http://localhost:5000/data/formats-data")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Formats Data cargado:", data);
        setFormatsData(data.FormatsData);
      })
      .catch((err) => console.error("❌ Error cargando formatos de Pokémon:", err));
  }, []);

  // Asignar tiers respetando `battleOnly` y `baseSpecies`
  useEffect(() => {
    if (!pokedex || !formatsData) return;
  
    console.log("🔄 Asignando tiers...");
  
    const getTier = (pokemon) => {
      // Primero intentamos obtener el tier directamente
      if (formatsData[pokemon]?.tier) {
        return formatsData[pokemon].tier;
      }
    
      // Verificamos si tiene battleOnly
      const battleOnlyParent = pokedex[pokemon]?.battleOnly;
      if (typeof battleOnlyParent === "string") { // ✅ Solo usamos toLowerCase si es un string
        const battleOnlyKey = battleOnlyParent.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (formatsData[battleOnlyKey]?.tier) {
          console.log(`ℹ️ ${pokemon} hereda el tier de su battleOnly: ${battleOnlyKey}`);
          return formatsData[battleOnlyKey].tier;
        }
      }
    
      // Si tiene baseSpecies, tomamos el tier de su base
      const baseSpecies = pokedex[pokemon]?.baseSpecies;
      if (typeof baseSpecies === "string") {
        const baseSpeciesKey = baseSpecies.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (formatsData[baseSpeciesKey]?.tier) {
          console.log(`ℹ️ ${pokemon} hereda el tier de su baseSpecies: ${baseSpeciesKey}`);
          return formatsData[baseSpeciesKey].tier;
        }
      }
    
      // Si no hay ninguna fuente de tier, lo marcamos como "Unknown"
      return "Unknown";
    };
  
    const bannedTiers = ["Uber", "AG", "Illegal"]; // ❌ Tiers prohibidas
  
    const processedPokemon = Object.keys(pokedex)
      .filter((pokemon) => {
        const tier = getTier(pokemon);
        const isNonstandard = pokedex[pokemon]?.isNonstandard || "";
  
        // ❌ Excluir si el tier está en la lista de baneados
        if (bannedTiers.some((banned) => tier.includes(banned))) {
          console.log(`❌ ${pokemon} (${tier}) está baneado por tier.`);
          return false;
        }
  
        // ❌ Excluir si isNonstandard es "CAP"
        if (isNonstandard === "CAP") {
          console.log(`❌ ${pokemon} está baneado por isNonstandard: CAP.`);
          return false;
        }
  
        return true;
      })
      .map((pokemon) => {
        const tier = getTier(pokemon);
        const pokemonData = pokedex[pokemon];
  
        return {
          name: pokemonData.name,
          types: pokemonData.types.join(", "),
          abilities: Object.values(pokemonData.abilities).join(", "),
          stats: pokemonData.baseStats,
          tier: tier,
        };
      });
  
    console.log("✅ Pokémon permitidos:", processedPokemon);
    setFilteredPokemon(processedPokemon);
  }, [pokedex, formatsData]);
  

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
