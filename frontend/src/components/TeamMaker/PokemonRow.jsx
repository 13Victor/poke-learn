const PokemonRow = ({ pokemon, onClick }) => {
  return (
    <tr onClick={() => onClick(pokemon)}>
      <td>{pokemon.name}</td>
      <td>{pokemon.tier}</td>
      <td>
        {Array.isArray(pokemon.types)
          ? pokemon.types.join(", ")
          : pokemon.types}
      </td>
      <td>
        {Array.isArray(pokemon.abilities)
          ? pokemon.abilities.join(", ")
          : pokemon.abilities}
      </td>
      <td>{pokemon.stats.hp}</td>
      <td>{pokemon.stats.atk}</td>
      <td>{pokemon.stats.def}</td>
      <td>{pokemon.stats.spa}</td>
      <td>{pokemon.stats.spd}</td>
      <td>{pokemon.stats.spe}</td>
    </tr>
  );
};

export default PokemonRow;
