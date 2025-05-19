import { useAuth } from "../../contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";

// Componente para rutas protegidas (requieren autenticación)
export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log(
    "[ProtectedRoute] Verificando acceso. isAuthenticated:",
    isAuthenticated,
    "loading:",
    loading,
    "path:",
    location.pathname
  );

  // Si estamos cargando, permitir renderizar temporalmente para evitar parpadeos
  if (loading) {
    console.log("[ProtectedRoute] Cargando, permitiendo renderizado temporal");
    return <Outlet />;
  }

  // Si no está autenticado, redirigir a login y guardar la ubicación actual
  if (!isAuthenticated) {
    console.log("[ProtectedRoute] Usuario no autenticado, redirigiendo a login");
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Si está autenticado, permitir acceso a la ruta protegida
  console.log("[ProtectedRoute] Usuario autenticado, permitiendo acceso");
  return <Outlet />;
};

// Componente para rutas de autenticación (solo accesibles si NO está autenticado)
export const AuthRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/user";

  console.log("[AuthRoute] Verificando acceso. isAuthenticated:", isAuthenticated, "loading:", loading, "from:", from);

  // Si estamos cargando, permitir renderizar temporalmente para evitar parpadeos
  if (loading) {
    console.log("[AuthRoute] Cargando, permitiendo renderizado temporal");
    return <Outlet />;
  }

  // Si está autenticado, redirigir a la página de usuario o a la ubicación anterior
  if (isAuthenticated) {
    console.log("[AuthRoute] Usuario autenticado, redirigiendo a:", from);
    return <Navigate to={from} replace />;
  }

  // Si no está autenticado, permitir acceso a la ruta de autenticación
  console.log("[AuthRoute] Usuario no autenticado, permitiendo acceso");
  return <Outlet />;
};
