import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ProtectedRoute, AuthRoute } from "./common/ProtectedRoute";
import LoadingScreen from "./common/LoadingScreen";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword"; // Nueva importación
import PasswordResetSuccess from "./PasswordResetSuccess"; // Nueva importación
import User from "./User";
import TeamMaker from "./TeamMaker/TeamMaker";
import Teams from "./Teams/Teams";
import Combat from "./Battle/Combat"; // Cambiado de Battle a Combat
import Pokedex from "./Pokedex/Pokedex";
import { useAuth } from "../contexts/AuthContext";
import BattleSetup from "./Battle/BattleSetup";

function AuthRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log(
    "[AuthRoutes] Renderizando rutas. isAuthenticated:",
    isAuthenticated,
    "loading:",
    loading,
    "path:",
    location.pathname
  );

  // Si estamos cargando, mostrar pantalla de carga
  if (loading) {
    console.log("[AuthRoutes] Mostrando pantalla de carga");
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Ruta raíz - redirige según la autenticación */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/user" : "/auth/login"} state={{ from: location }} replace />}
      />

      {/* Rutas de autenticación - solo accesibles si NO está autenticado */}
      <Route element={<AuthRoute />}>
        <Route path="/auth" element={<Navigate to="/auth/login" />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} /> {/* Nueva ruta */}
        <Route path="/auth/reset-success" element={<PasswordResetSuccess />} /> {/* Nueva ruta */}
      </Route>

      {/* Rutas protegidas - solo accesibles si está autenticado */}
      <Route element={<ProtectedRoute />}>
        <Route path="/user" element={<User />} />
        <Route path="/pokedex" element={<Pokedex />} />
        <Route path="/teammaker" element={<TeamMaker />} />
        <Route path="/teammaker/:teamId" element={<TeamMaker />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/battle" element={<BattleSetup />} />
        <Route path="/battle/combat" element={<Combat />} />
      </Route>

      {/* Ruta 404 - cuando ninguna otra ruta coincide */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default AuthRoutes;
