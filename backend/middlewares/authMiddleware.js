const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Obtener el token del header

    if (!token) {
        return res.status(403).json({ message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Guardamos los datos del usuario en req.user
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = verifyToken;
