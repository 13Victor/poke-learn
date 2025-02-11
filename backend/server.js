const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

dotenv.config(); // Cargar variables de entorno

const app = express();
app.use(express.json());
app.use(cors());

// Rutas 
app.use('/auth', authRoutes); 
app.use('/user', userRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
