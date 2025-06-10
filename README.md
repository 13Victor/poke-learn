# PokéLearn - Proyecto Final de Ciclo DAW
**PokéLearn** es una aplicación web interactiva diseñada para ayudar a los entrenadores Pokémon a crear, gestionar y optimizar sus equipos competitivos. La plataforma combina funcionalidades de creación de equipos como de combates Pokémon.


## Instrucciones de instalación y ejecución

### 1. Requisitos previos
- Node.js >= 16.0.0
- npm >= 8.0.0
- MySQL Server

### 2. Instalación
```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd pokelearn

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 3. Configuración
```bash
# Backend - configurar variables de entorno
cd backend
cp .env.example .env
# Editar .env con tus configuraciones de BD y Firebase

# Frontend - configurar variables de entorno
cd ../frontend
cp .env.example .env
# Configurar URLs de API y Firebase
```

### 4. Ejecución
```bash
# Backend (Puerto 5000)
cd backend
npm start

# Frontend (Puerto 5173)
cd frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
