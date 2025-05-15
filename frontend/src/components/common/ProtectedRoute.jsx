// src/components/common/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Componente para rutas que requieren autenticación
export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading">Verificando autenticación...</div>;
  }

  if (!isAuthenticated) {
    // Redirigir a login y guardar la ubicación actual para volver después del login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// Componente para rutas de autenticación (login/register)
// Redirige a /user si el usuario ya está autenticado
export const AuthRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Verificando autenticación...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/user" replace />;
  }

  return <Outlet />;
};

// Exportar por defecto ProtectedRoute para que sea más fácil de importar
export default ProtectedRoute;
