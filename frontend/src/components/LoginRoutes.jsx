import { Routes, Route, Navigate } from "react-router-dom";
import Login from './Login';
import Register from './Register';
import User from './User'

function LoginRoutes() {
    
    const RootRedirect = () => {
        const token = localStorage.getItem('token');
        return <Navigate to={token ? "/user" : "/auth/login"} />;
    };
    
    // Protege rutas privadas (solo accedibles con token)
    const PrivateRoute = ({ children }) => {
        const token = localStorage.getItem('token');
        return token ? children : <Navigate to="/auth/login" />;
    };
    
    // Evita que los usuarios autenticados accedan a login/register
    const AuthRoute = ({ children }) => {
        const token = localStorage.getItem('token');
        return token ? <Navigate to="/user" /> : children;
    };

    return (
        <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<AuthRoute><Home /></AuthRoute>} />
            <Route path="/auth/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/auth/register" element={<AuthRoute><Register /></AuthRoute>} />
            <Route path="/user" element={<PrivateRoute><User /></PrivateRoute>} />
        </Routes>
    );
};

export default LoginRoutes;
