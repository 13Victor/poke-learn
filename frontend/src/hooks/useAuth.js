// src/hooks/useAuth.js

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase.config";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Error en la autenticación:", error);
        setError(error);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return unsubscribe;
  }, []);

  return { currentUser, loading, error };
}

// Función auxiliar para verificar si el email está verificado
export function isEmailVerified() {
  return auth.currentUser?.emailVerified || false;
}

// Función para reenviar el email de verificación
export async function resendVerificationEmail() {
  try {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await auth.currentUser.sendEmailVerification();
      return { success: true, message: "Email de verificación reenviado" };
    }
    return { success: false, message: "No hay usuario activo o ya está verificado" };
  } catch (error) {
    console.error("Error al reenviar email:", error);
    return {
      success: false,
      message: "Error al reenviar email",
      error: error.message,
    };
  }
}
