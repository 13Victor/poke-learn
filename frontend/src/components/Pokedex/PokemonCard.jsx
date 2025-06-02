import React, { useEffect, useRef, useState } from "react";
import { formatPokemonId, generatePokemonImagePath, generateTypeBackground } from "../../utils/pokemonUtils";
import { handleImageError, formatPokemonTypes } from "../../utils/imageUtils";

const PokemonCard = ({ pokemon, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);
  const pokemonId = formatPokemonId(pokemon.num);
  const pokemonTypes = formatPokemonTypes(pokemon.types);
  const pokemonImagePath = generatePokemonImagePath(pokemon);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            // Pequeño delay para que la animación sea más visible
            setTimeout(() => {
              setIsVisible(true);
            }, 100);
          }
        });
      },
      {
        threshold: 0.1, // Se activa cuando el 10% de la card es visible
        rootMargin: "50px", // Se activa 50px antes de que sea completamente visible
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [isVisible]);

  return (
    <div
      ref={cardRef}
      key={pokemon.id}
      className={`pokemon ${isVisible ? "visible" : ""}`}
      id={pokemonId}
      onClick={() => onClick && onClick(pokemon)}
    >
      <p
        className="pokemon-id-back"
        style={{
          "--pokemon-id": `"#${pokemonId}"`,
          "--pokemon-background": generateTypeBackground(pokemon.types),
        }}
      >
        #{pokemonId}
      </p>
      <div className="pokedex-pokemon-img">
        <img src={pokemonImagePath} alt={pokemon.name} onError={(e) => handleImageError(e, pokemon)} />
      </div>
      <div className="pokemon-info">
        <div className="name-container">
          <h4 className="pokemon-name">{pokemon.name}</h4>
        </div>
        <div className="pokemon-types-pokedex">{pokemonTypes}</div>
      </div>
    </div>
  );
};

export default PokemonCard;
