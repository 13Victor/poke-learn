import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Estilos básicos
import "tippy.js/animations/scale.css"; // Animación opcional

const PokeInfo = ({ name, level, types }) => {
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
          <Tippy
            key={index} // ✅ Debe estar aquí, en el elemento padre
            content={type}
            animation="scale"
            delay={[300, 100]}
            placement="top"
          >
            <img
              className="small-icon"
              src={`/assets/type-icons/${type}.svg`}
              alt={type}
            />
          </Tippy>
        ))}
      </span>
    </div>
  );
};

export default PokeInfo;
