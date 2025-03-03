import { useState } from "react";

function AdminPanel() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Función genérica para manejar acciones
  const handleAction = async (endpoint, successMessage) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5000/admin/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error desconocido");
      }

      setSuccess(successMessage);
    } catch (error) {
      setError(error.message);
    }
  };


  return (
    <div>
    <h2>Admin Panel</h2>
      <p>Esta es una página protegida. Solo los usuarios autenticados pueden verla.</p>
      <div>
        <h4>Acciones base de datos</h4>
        <button onClick={() => handleAction("create-db", "Base de datos creada.")}>
          Crear base de datos
        </button>
        <button onClick={() => handleAction("fill-db/item", "Tabla item rellenada.")}>
          Rellenar tabla item
        </button>
        <button onClick={() => handleAction("fill-db/ability", "Tabla ability rellenada.")}>
          Rellenar tabla ability
        </button>
        <button onClick={() => handleAction("fill-db/type", "Tabla type rellenada.")}>
          Rellenar tabla type
        </button>
        <button
          onClick={() => handleAction("fill-db/typeEffectiveness", "Tabla typeEffectiveness rellenada.")}
        >
          Rellenar tabla typeEffectiveness
        </button>
        <button
          onClick={() => handleAction("fill-db/pokemon", "Tabla pokemon rellenada.")}
        >
          Rellenar tabla pokemon
        </button>
        <button
          onClick={() => handleAction("fill-db/move", "Tabla move rellenada.")}
        >
          Rellenar tabla move
        </button>
        <button
          onClick={() => handleAction("fill-db/pokemonMove", "Tabla pokemonMove rellenada.")}
        >
          Rellenar tabla pokemonMove
        </button>
        <button
          onClick={() => handleAction("fill-db/pokemonAbility", "Tabla pokemonAbility rellenada.")}
        >
          Rellenar tabla pokemonAbility
        </button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}

export default AdminPanel;