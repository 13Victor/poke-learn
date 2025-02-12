import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

function User() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const getToken = () => {
        return localStorage.getItem('token');
    };

    const removeToken = () => {
        localStorage.removeItem('token');
        navigate('/auth/login');
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = getToken();

                if (!token) {
                    throw new Error("No autorizado. Inicia sesión.");
                }

                const response = await fetch('http://localhost:5000/user', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Error al obtener el perfil");
                }

                setUser(data.user);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchUserProfile();
    }, []);

    return (
        <div>
            <h2>Perfil de Usuario</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {user ? (
                <div>
                    <p>Id: {user.id}</p>
                    <p>Email: {user.email}</p>
                    <p>Nombre de Usuario: {user.user_name}</p>
                    <p>Bienvenido a tu perfil</p>
                </div>
            ) : (
                <p>Cargando...</p>
            )}

            <button onClick={removeToken}>Cerrar Sesión</button>
        </div>
    );
}

export default User;
