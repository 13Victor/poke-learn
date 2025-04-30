import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Estilos básicos
import "tippy.js/animations/scale.css"; // Animación opcional

const PokeInfo = ({ name, level, types, index }) => {
  return (
    <div className="mainInfoContainer flex">
      <span className="name-levelContainer flex">
        <p>{name || `Pokémon ${index + 1}`}</p>
        <span className="pokemonCurrentLevel flex-center">
          <strong>Lv.</strong>
          <p>{level}</p>
        </span>
      </span>
      <span className="pokemonTypeing flex-center">
        {types.map((type, index) => (
          <Tippy
            key={index}
            content={
              <div className="type-tooltip-content">
                <img className="type-icon" src={`/assets/type-icons/${type}_banner.png`} alt={type} />
              </div>
            }
            placement="top"
            animation="scale"
            theme={`type-tooltip-${type.toLowerCase()} transparent`}
            delay={[300, 100]}
            arrow={true}
          >
            <img className="small-icon" src={`/assets/type-icons/${type}.png`} alt={type} />
          </Tippy>
        ))}
      </span>
    </div>
  );
};

export default PokeInfo;
