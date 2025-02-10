import { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5000/login', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error desconocido");
            }

            setSuccess("Login exitoso. Redirigiendo...");
            console.log("Usuario autenticado:", data.user, data.message);

        } catch (error) {
            setError(error.message);
        }
    setEmail('');
    setPassword('');
    };

    return (
        <>
        <div>
            <h3>Login</h3>
            <form onSubmit={handleSubmit} className="login-form">            
                <input
                    type="text"
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
                <input type="submit" value="Login" />
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
        <Link to="/register">Ir a Register</Link>
        </>
    );
}

export default Login;
