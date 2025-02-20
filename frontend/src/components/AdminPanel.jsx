import { useState } from "react";

function AdminPanel() {

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const createDatabase = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5000/admin/create-db', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error desconocido");
            }

            setSuccess("Database creada.");

        } catch (error) {
            setError(error.message);
        }
    };
    return (
        <div>
            <h2>Admin Panel</h2>
            <p>Esta es una página protegida. Solo los usuarios autenticados pueden verla.</p>
            <div>
                <h4>Acciones base de datos</h4>
                <button onClick={createDatabase}>Crear base de datos</button>
                <button>Rellenar base de datos</button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
    );
}

export default AdminPanel;