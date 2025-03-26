const PokeInfo = ({ name, level, types }) => {
  console.log("🔍 Información de Pokémon:", name, level, types);
  return (
    <div className="mainInfoContainer flex">
      <span className="name-levelContainer flex">
        <p>{name}</p>
        <span className="pokemonCurrentLevel flex-center">
          <strong>Lv.</strong>
          <p>{level}</p>
        </span>
      </span>
      <span className="pokemonTypeing flex-center">
        {types.map((type, index) => (
          <img
            key={index}
            className="small-icon"
            src={type.icon}
            alt={type.name}
          />
        ))}
      </span>
    </div>
  );
};

export default PokeInfo;
