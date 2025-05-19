import React, { useState, useEffect } from "react";

// Componente para mostrar una pantalla de carga
const LoadingScreen = ({ children, timeout = 800 }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("[LoadingScreen] Iniciando pantalla de carga");

    // Establecer un tiempo mínimo para mostrar la pantalla de carga
    // para evitar parpadeos en cargas rápidas
    const timer = setTimeout(() => {
      console.log("[LoadingScreen] Tiempo de carga mínimo alcanzado");
      setIsLoading(false);
    }, timeout);

    return () => {
      console.log("[LoadingScreen] Limpiando temporizador de carga");
      clearTimeout(timer);
    };
  }, [timeout]);

  // Si ya no estamos cargando, mostrar los children
  if (!isLoading) {
    console.log("[LoadingScreen] Carga completada, mostrando contenido");
    return <>{children}</>;
  }

  // Mostrar pantalla de carga
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <img src="/pokemon-logo.png" alt="Pokémon Battle App" className="loading-logo" />
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
