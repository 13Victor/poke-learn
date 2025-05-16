// src/components/AuthRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, AuthRoute } from "./common/ProtectedRoute";
import LoadingScreen from "./common/LoadingScreen";
import Login from "./Login";
import Register from "./Register";
import User from "./User";
import TeamMaker from "./TeamMaker/TeamMaker";
import Teams from "./Teams/Teams";
import Battle from "./Battle/Combat";
import { useAuth } from "../contexts/AuthContext";

function AuthRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <LoadingScreen>
      <Routes>
        {/* Ruta raíz - redirige según la autenticación */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/user" : "/auth/login"} />} />

        {/* Rutas de autenticación - solo accesibles si NO está autenticado */}
        <Route element={<AuthRoute />}>
          <Route path="/auth" element={<Navigate to="/auth/login" />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
        </Route>

        {/* Rutas protegidas - solo accesibles si está autenticado */}
        <Route element={<ProtectedRoute />}>
          <Route path="/user" element={<User />} />
          <Route path="/teammaker" element={<TeamMaker />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/battle" element={<Battle />} />
        </Route>

        {/* Ruta 404 - cuando ninguna otra ruta coincide */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </LoadingScreen>
  );
}

export default AuthRoutes;
