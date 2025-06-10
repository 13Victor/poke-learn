# PokéLearn - Proyecto Final de Ciclo DAW

**PokéLearn** es una aplicación web interactiva diseñada para ayudar a los entrenadores Pokémon a crear, gestionar y optimizar sus equipos competitivos. La plataforma combina funcionalidades de construcción de equipos con simulaciones de combates Pokémon.

---

## 🚀 Instrucciones de instalación y ejecución

### ✅ Requisitos previos

- Node.js >= 16.0.0  
- npm >= 8.0.0  
- MySQL Server  

---

### 📦 Instalación

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

### ⚙️ Configuración

# Configuración del Backend
cd backend
cp .env.example .env
# Edita el archivo .env con tus datos de base de datos y credenciales de Firebase

# Configuración del Frontend
cd ../frontend
cp .env.example .env
