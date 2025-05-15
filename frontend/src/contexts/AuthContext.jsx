import { createContext, useState, useEffect, useContext, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase.config";
import apiService from "../services/apiService";

// Crear contexto
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Referencias para evitar múltiples verificaciones
  const authCheckInProgress = useRef(false);
  const initialCheckDone = useRef(false);
  const loggingOut = useRef(false);

  // Función para verificar token en el backend
  const verifyBackendToken = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setCurrentUser(null);
        return false;
      }

      const response = await apiService.checkAuth();
      if (response.success && response.data && response.data.user) {
        setCurrentUser(response.data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error verificando token:", error);
      localStorage.removeItem("token");
      setCurrentUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Observador para el estado de autenticación de Firebase
  useEffect(() => {
    // Evitar múltiples verificaciones simultáneas
    if (authCheckInProgress.current) {
      return;
    }

    authCheckInProgress.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Si estamos cerrando sesión, no hacer nada
      if (loggingOut.current) {
        return;
      }

      if (!initialCheckDone.current) {
        setLoading(true);
        initialCheckDone.current = true;
      }

      try {
        if (firebaseUser) {
          // El usuario está autenticado en Firebase
          console.log("Usuario autenticado en Firebase:", firebaseUser.email);

          // Si hay un token en localStorage, verificarlo
          const tokenValid = await verifyBackendToken();

          if (!tokenValid) {
            // Si el token no es válido pero el usuario está en Firebase,
            // intentar obtener un nuevo token
            if (firebaseUser.emailVerified) {
              const idToken = await firebaseUser.getIdToken();
              const userInfo = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              };

              const loginResponse = await apiService.loginWithFirebase(userInfo, idToken);

              if (loginResponse.success) {
                localStorage.setItem("token", loginResponse.data.token);
                setCurrentUser(loginResponse.data.user);
              } else {
                throw new Error(loginResponse.message);
              }
            } else {
              setError("Por favor verifica tu correo electrónico antes de iniciar sesión");
              setCurrentUser(null);
            }
          }
        } else {
          // El usuario no está autenticado en Firebase
          // Verificar si tenemos un token válido en el backend
          await verifyBackendToken();
        }
      } catch (error) {
        console.error("Error en autenticación:", error);
        setError(error.message);
        localStorage.removeItem("token");
        setCurrentUser(null);
      } finally {
        setLoading(false);
        authCheckInProgress.current = false;
      }
    });

    // Limpiar observer al desmontar
    return () => {
      unsubscribe();
      authCheckInProgress.current = false;
    };
  }, []);

  // Función para cerrar sesión
  const logout = async () => {
    try {
      // Marcar que estamos cerrando sesión para evitar efectos secundarios
      loggingOut.current = true;
      setLoading(true);

      // Primero, limpiar localStorage para evitar peticiones con el token antiguo
      localStorage.removeItem("token");

      // Luego, actualizar el estado
      setCurrentUser(null);

      // Por último, cerrar sesión en Firebase
      if (auth.currentUser) {
        await signOut(auth).catch((e) => console.error("Error al cerrar sesión en Firebase:", e));
      }

      // Redireccionar a login
      console.log("Sesión cerrada correctamente, redirigiendo a /auth/login");
      navigate("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setError("Error al cerrar sesión");
    } finally {
      setLoading(false);
      loggingOut.current = false;
    }
  };

  // Valor del contexto
  const value = {
    currentUser,
    loading,
    error,
    setError,
    isAuthenticated: !!currentUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
