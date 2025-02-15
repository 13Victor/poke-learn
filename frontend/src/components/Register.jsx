import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

function Register() {
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5000/auth/register', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_name: userName, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error desconocido");
            }

            setSuccess("Registro exitoso. Redirigiendo...");
            console.log("Usuario registrado:", data.user, data.message);
            setTimeout(() =>  navigate('/auth/login'), 2000);

        } catch (error) {
            setError(error.message);
        }

        setUserName('');
        setEmail('');
        setPassword('');
    };

    return (
        <>
        <div>
            <h3>Register</h3>
            <form onSubmit={handleSubmit} className="register-form">
                <input
                    type="text"
                    placeholder="Nombre de usuario"
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <input type="submit" value="Register" />
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
        <Link to="/auth/login">Ir a Login</Link>
        </>
    );
}

export default Register;
