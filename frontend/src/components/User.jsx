import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase.config";

function User() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const getToken = () => {
    const token = localStorage.getItem("token");
    console.log(
      "Token recuperado de localStorage:",
      token ? `${token.substring(0, 15)}... (longitud: ${token.length})` : "No existe o es undefined"
    );

    // Si no hay token, borrar localStorage y redirigir
    if (!token) {
      console.log("No se encontró token, limpiando localStorage");
      localStorage.clear();
      return null;
    }

    return token;
  };

  const removeToken = async () => {
    try {
      // Cerrar sesión en Firebase
      if (typeof auth !== "undefined" && auth.currentUser) {
        await auth.signOut();
      }
    } catch (error) {
      console.error("Error al cerrar sesión en Firebase:", error);
    } finally {
      // Siempre eliminar el token local
      localStorage.removeItem("token");
      navigate("/auth/login");
    }
  };

  useEffect(() => {
    const checkAndFetchUser = async () => {
      setLoading(true);
      try {
        const token = getToken();

        if (!token) {
          throw new Error("No autorizado. Inicia sesión.");
        }

        console.log("Enviando solicitud a /auth/check con token");

        // Verificar si el token es válido primero
        const checkResponse = await fetch("http://localhost:5000/auth/check", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Respuesta de /auth/check recibida. Status:", checkResponse.status);

        const checkData = await checkResponse.json();
        console.log("Datos de respuesta:", checkData);

        if (!checkResponse.ok) {
          // Si el token no es válido, limpiar y redirigir a login
          console.error("Error en verificación de token:", checkData);
          localStorage.removeItem("token");
          throw new Error(checkData.message || "Sesión expirada. Por favor, inicia sesión nuevamente.");
        }

        if (checkData.success && checkData.data && checkData.data.user) {
          // Si tenemos el usuario directamente de /auth/check, lo usamos
          setUser(checkData.data.user);
        } else {
          throw new Error("Formato de respuesta inválido");
        }
      } catch (error) {
        console.error("Error general:", error);
        setError(error.message);

        // Si hay un error de autorización, redirigir al login
        if (
          error.message.includes("autorizado") ||
          error.message.includes("sesión") ||
          error.message.includes("token") ||
          error.message.includes("expirada")
        ) {
          setTimeout(() => navigate("/auth/login"), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAndFetchUser();
  }, [navigate]);
  if (loading) {
    return <div className="loading">Cargando información de usuario...</div>;
  }

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {user ? (
        <div className="user-profile">
          <h2>¡Bienvenido, {user.user_name}!</h2>
          <div className="user-details">
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Nombre de Usuario:</strong> {user.user_name}
            </p>
            <div className="profile-image">
              <img
                src={`http://localhost:5000/uploads/profile_pictures/${user.profile_picture}`}
                width={100}
                alt="Imagen de perfil"
              />
            </div>
          </div>
          <div className="actions">
            <button className="logout-button" onClick={removeToken}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="not-authenticated">
          <p>No has iniciado sesión o tu sesión ha expirado.</p>
          <button onClick={() => navigate("/auth/login")}>Ir a Login</button>
        </div>
      )}
    </div>
  );
}

export default User;
