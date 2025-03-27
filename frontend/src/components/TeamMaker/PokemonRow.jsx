const PokemonRow = ({ pokemon, onClick }) => {
  return (
    <tr onClick={() => onClick(pokemon)}>
      <td>
        <img
          src={`/assets/pokemon-small-hd-sprites/${pokemon.image}`}
          alt={pokemon.name}
        />
      </td>
      <td>{pokemon.name}</td>
      <td>{pokemon.tier}</td>
      <td>{pokemon.types.join(", ")}</td>
      <td>{pokemon.abilities.join(", ")}</td>
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
