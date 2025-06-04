// src/firebase.config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Configuración de Firebase (la que ya tienes)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la instancia de autenticación
export const auth = getAuth(app);

// Configuraciones para el restablecimiento de contraseña
export const passwordResetSettings = {
  url: `${window.location.origin}/auth/reset-success`,
  handleCodeInApp: false,
};

// Configuraciones para verificación de email
export const emailVerificationSettings = {
  url: `${window.location.origin}/auth/login`,
  handleCodeInApp: false,
};

export default app;
