import React, { createContext, useState, useEffect, useContext } from "react";

// Crear el contexto
const PokemonDataContext = createContext(null);

// Proveedor del contexto que manejará los fetch
export const PokemonDataProvider = ({ children }) => {
  const [pokemons, setPokemons] = useState([]);
  const [moves, setMoves] = useState({});
  const [learnsets, setLearnsets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar todos los datos al montar el proveedor
  useEffect(() => {
    let isMounted = true;
    console.log("🔄 Realizando fetch inicial de todos los datos");

    Promise.all([
      fetch("http://localhost:5000/data/availablePokemons").then((res) =>
        res.json()
      ),
      fetch("http://localhost:5000/data/moves").then((res) => res.json()),
      fetch("http://localhost:5000/data/learnsets").then((res) => res.json()),
    ])
      .then(([pokemonsData, movesData, learnsetsData]) => {
        if (isMounted) {
          setPokemons(pokemonsData);
          setMoves(movesData);
          setLearnsets(learnsetsData);
          setLoading(false);
          console.log("✅ Datos cargados correctamente");
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("❌ Error cargando datos:", err);
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Valor del contexto que se proporcionará a los componentes
  const value = {
    pokemons,
    moves,
    learnsets,
    loading,
    error,
  };

  return (
    <PokemonDataContext.Provider value={value}>
      {children}
    </PokemonDataContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const usePokemonData = () => {
  const context = useContext(PokemonDataContext);
  if (context === null) {
    throw new Error(
      "usePokemonData debe usarse dentro de un PokemonDataProvider"
    );
  }
  return context;
};
