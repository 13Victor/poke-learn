const PokemonData = ({
  name,
  level,
  types,
  item,
  ability,
  moves,
  onChange,
}) => {
  return (
    <div className="pokemonDataContainer">
      <TeamMakerPokeInfo name={name} level={level} types={types} />
      <TeamMakerItemAbility item={item} ability={ability} onChange={onChange} />
      <hr id="separatorLine" />
      <TeamMakerMoveSet moves={moves} onChange={onChange} />
    </div>
  );
};

export default PokemonData;
