import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";

function User() {
  const [loading, setLoading] = useState(true);
  const { currentUser, isAuthenticated, logout, error: authError, setError, clearError } = useAuth();
  const [error, setLocalError] = useState("");
  const navigate = useNavigate();

  // Referencia para controlar si el componente está montado
  const isMounted = useRef(true);

  // Cleanup al desmontar
  useEffect(() => {
    // Limpiar errores al montar el componente
    clearError();

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      // No realizar la llamada si no estamos autenticados o si ya tenemos el error de auth
      if (!isAuthenticated || authError) {
        setLoading(false);
        return;
      }

      try {
        // Obtener datos adicionales del usuario si es necesario
        const response = await apiService.getUserProfile();

        // Verificar si el componente sigue montado antes de actualizar el estado
        if (isMounted.current) {
          setLoading(false);

          if (!response.success) {
            throw new Error(response.message);
          }
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);

        // Solo actualizar estados si el componente sigue montado
        if (isMounted.current) {
          setLocalError(error.message);
          setLoading(false);

          // Si hay un error de autorización, redirigir al login después de un tiempo
          if (
            error.message.includes("autorizado") ||
            error.message.includes("sesión") ||
            error.message.includes("token") ||
            error.message.includes("expirada")
          ) {
            // Limpiar información de autenticación
            localStorage.removeItem("token");
            setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");

            // Usar un setTimeout para dar tiempo a otros efectos a ejecutarse
            setTimeout(() => {
              if (isMounted.current) {
                navigate("/auth/login");
              }
            }, 2000);
          }
        }
      }
    };

    fetchUserData();
  }, [isAuthenticated, navigate, setError, authError, clearError]);

  const handleLogout = async () => {
    // Marcar el componente como no montado antes del logout
    // para evitar actualizar estados después de la navegación
    isMounted.current = false;
    await logout();
  };

  if (loading) {
    return <div className="loading">Cargando información de usuario...</div>;
  }

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {authError && <p style={{ color: "red" }}>{authError}</p>}
      {currentUser ? (
        <div className="user-profile">
          <h2>¡Bienvenido, {currentUser.user_name}!</h2>
          <div className="user-details">
            <p>
              <strong>ID:</strong> {currentUser.id}
            </p>
            <p>
              <strong>Email:</strong> {currentUser.email}
            </p>
            <p>
              <strong>Nombre de Usuario:</strong> {currentUser.user_name}
            </p>
            <div className="profile-image">
              {currentUser.profile_picture ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/profile_pictures/${currentUser.profile_picture}`}
                  width={100}
                  alt="Imagen de perfil"
                />
              ) : (
                <div className="no-image">Sin imagen de perfil</div>
              )}
            </div>
          </div>
          <div className="actions">
            <button className="logout-button" onClick={handleLogout}>
              Cerrar Sesión
            </button>
            <button onClick={() => navigate("/teammaker")}>Ir al creador de equipos</button>
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
