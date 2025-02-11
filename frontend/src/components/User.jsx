import { useEffect, useState } from "react";

function User() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
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
                    <p>Email: {user.email}</p>
                    <p>Bienvenido a tu perfil</p>
                </div>
            ) : (
                <p>Cargando...</p>
            )}
        </div>
    );
}

export default User;
