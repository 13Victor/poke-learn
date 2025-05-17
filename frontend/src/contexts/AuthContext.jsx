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

  // Función para limpiar el error cuando cambia el estado de autenticación
  const clearError = () => {
    if (error) setError("");
  };

  // Función para verificar token en el backend
  const verifyBackendToken = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setCurrentUser(null);
        return false;
      }

      console.log("Verificando token con el backend...");
      const response = await apiService.checkAuth();

      if (response.success && response.data && response.data.user) {
        console.log("Token válido, usuario autenticado:", response.data.user.email);
        setCurrentUser(response.data.user);
        clearError(); // Limpiar error al verificar token exitosamente
        return true;
      } else {
        console.log("Token inválido o respuesta sin datos de usuario");
        return false;
      }
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
        // Verificar primero si hay un token en localStorage
        const tokenValid = await verifyBackendToken();

        // Si el token es válido, no es necesario hacer más verificaciones
        if (tokenValid) {
          console.log("Token válido en localStorage, usuario autenticado");
          authCheckInProgress.current = false;
          return;
        }

        if (firebaseUser) {
          // Limpiar errores anteriores cuando hay un cambio en la autenticación
          clearError();

          // El usuario está autenticado en Firebase
          console.log("Usuario autenticado en Firebase:", firebaseUser.email);
          console.log("Email verificado:", firebaseUser.emailVerified);

          // Verificar si el email está verificado
          if (!firebaseUser.emailVerified) {
            console.log("Email no verificado");
            setError("Por favor verifica tu correo electrónico antes de iniciar sesión");
            setCurrentUser(null);
            setLoading(false);
            authCheckInProgress.current = false;
            return;
          }

          // Si el token no es válido pero el usuario está autenticado en Firebase,
          // intentar obtener un nuevo token
          const idToken = await firebaseUser.getIdToken();
          const userInfo = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };

          console.log("Obteniendo nuevo token para usuario:", userInfo.email);

          const loginResponse = await apiService.loginWithFirebase(userInfo, idToken);

          if (loginResponse.success) {
            console.log("Login con Firebase exitoso en AuthContext");
            localStorage.setItem("token", loginResponse.data.token);
            setCurrentUser(loginResponse.data.user);
            clearError(); // Limpiar error en caso de éxito
          } else {
            throw new Error(loginResponse.message);
          }
        } else {
          // El usuario no está autenticado en Firebase ni en el backend
          console.log("Usuario no autenticado ni en Firebase ni en backend");
          setCurrentUser(null);
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
      clearError(); // Limpiar errores anteriores

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
    clearError, // Exportar la función para limpiar errores
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
