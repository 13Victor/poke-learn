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

    const fillItemTable = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5000/admin/fill-db/item', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error desconocido");
            }

            setSuccess("Tabla item creada.");

        } catch (error) {
            setError(error.message);
        }
    };

    const fillAbilityTable = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5000/admin/fill-db/ability', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error desconocido");
            }

            setSuccess("Tabla item creada.");

        } catch (error) {
            setError(error.message);
        }
    };

    const fillTypeTable = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5000/admin/fill-db/type', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error desconocido");
            }

            setSuccess("Tabla item creada.");

        } catch (error) {
            setError(error.message);
        }
    };

    const fillTypeEffectivenessTable = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5000/admin/fill-db/typeEffectiveness', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error desconocido");
            }

            setSuccess("Tabla item creada.");

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
                <button onClick={fillItemTable}>Rellenar tabla item</button>
                <button onClick={fillAbilityTable}>Rellenar tabla ability</button>
                <button onClick={fillTypeTable}>Rellenar tabla type</button>
                <button onClick={fillTypeEffectivenessTable}>Rellenar tabla type</button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
    );
}

export default AdminPanel;