import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import User from "./User";
import AdminPanel from "./AdminPanel";
import TeamBuilder from "./TeamBuilder";
import TeamMaker from "./TeamMaker/TeamMaker";

function AuthRoutes() {
  const RootRedirect = () => {
    const token = localStorage.getItem("token");
    return <Navigate to={token ? "/user" : "/auth/login"} />;
  };

  // Protege rutas privadas (solo accedibles con token)
  const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/auth/login" />;
  };

  // Redirige a /user si el usuario está autenticado desde /auth
  const AuthRedirectRoute = () => {
    const token = localStorage.getItem("token");
    return token ? <Navigate to="/user" /> : <Navigate to="/auth/login" />;
  };

  // Evita que los usuarios autenticados accedan a login/register
  const AuthRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    return token ? <Navigate to="/user" /> : children;
  };

  // Evita que los usuarios autenticados accedan al admin panel
  const AdminPanelRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/auth/login" />;
  };

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<AuthRedirectRoute></AuthRedirectRoute>} />
      <Route
        path="/auth/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/auth/register"
        element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        }
      />
      <Route
        path="/user"
        element={
          <PrivateRoute>
            <User />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminPanelRoute>
            <AdminPanel />
          </AdminPanelRoute>
        }
      />
      <Route
        path="/teambuilder"
        element={
          <PrivateRoute>
            <TeamBuilder />
          </PrivateRoute>
        }
      />
      <Route
        path="/teammaker"
        element={
          <PrivateRoute>
            <TeamMaker />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default AuthRoutes;
