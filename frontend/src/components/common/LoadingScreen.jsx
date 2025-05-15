import React from "react";
import { usePokemonData } from "../../contexts/PokemonDataContext";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/LoadingScreen.css"; // Deberás crear este archivo CSS

const LoadingScreen = ({ children }) => {
  const { isLoading: dataLoading, isAllDataLoaded } = usePokemonData();
  const { loading: authLoading, isAuthenticated } = useAuth();

  // Si estamos autenticados y cargando datos, mostrar pantalla de carga
  const showLoading = isAuthenticated && dataLoading && !isAllDataLoaded;

  // Si estamos verificando la autenticación, también mostrar pantalla de carga
  const showAuthLoading = authLoading;

  if (showLoading || showAuthLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <h2>Cargando Pokémon...</h2>
          <p>Estamos preparando tus datos, esto puede tardar unos segundos.</p>
        </div>
      </div>
    );
  }

  // Si no estamos cargando, mostrar los hijos
  return children;
};

export default LoadingScreen;
