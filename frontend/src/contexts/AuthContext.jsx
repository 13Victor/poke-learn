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
  const manualLoginInProgress = useRef(false); // Nueva referencia para controlar login manual

  // Estado adicional para depuración
  const [debugState, setDebugState] = useState({
    lastAction: null,
    lastTokenCheck: null,
    manualLoginActive: false,
  });

  // Función para limpiar el error cuando cambia el estado de autenticación
  const clearError = () => {
    if (error) setError("");
  };

  // Función para verificar token en el backend
  const verifyBackendToken = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.log("[AuthContext] No hay token en localStorage");
        setCurrentUser(null);
        setDebugState((prev) => ({ ...prev, lastTokenCheck: "No token found" }));
        return false;
      }

      console.log("[AuthContext] Verificando token con el backend...");
      setDebugState((prev) => ({ ...prev, lastTokenCheck: "Verificando token" }));

      const response = await apiService.checkAuth();

      if (response.success && response.data && response.data.user) {
        console.log("[AuthContext] Token válido, usuario autenticado:", response.data.user.email);
        setCurrentUser(response.data.user);
        clearError(); // Limpiar error al verificar token exitosamente
        setDebugState((prev) => ({ ...prev, lastTokenCheck: "Token válido" }));
        return true;
      } else {
        console.log("[AuthContext] Token inválido o respuesta sin datos de usuario");
        setDebugState((prev) => ({ ...prev, lastTokenCheck: "Token inválido" }));
        return false;
      }
    } catch (error) {
      console.error("[AuthContext] Error verificando token:", error);
      localStorage.removeItem("token");
      setCurrentUser(null);
      setDebugState((prev) => ({ ...prev, lastTokenCheck: "Error: " + error.message }));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para establecer estado de login manual
  const setManualLoginInProgress = (value) => {
    console.log("[AuthContext] Estableciendo manualLoginInProgress a:", value);
    manualLoginInProgress.current = value;
    setDebugState((prev) => ({
      ...prev,
      manualLoginActive: value,
      lastAction: value ? "Manual login iniciado" : "Manual login finalizado",
    }));
  };

  // Forzar actualización del estado de autenticación
  const forceAuthCheck = async () => {
    console.log("[AuthContext] Forzando verificación de autenticación");
    setDebugState((prev) => ({ ...prev, lastAction: "Verificación forzada" }));
    return await verifyBackendToken();
  };

  // Observador para el estado de autenticación de Firebase
  useEffect(() => {
    console.log("[AuthContext] Inicializando observador de autenticación");

    // Evitar múltiples verificaciones simultáneas
    if (authCheckInProgress.current) {
      console.log("[AuthContext] Ya hay una verificación en progreso, omitiendo");
      return;
    }

    authCheckInProgress.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthContext] Cambio en estado de autenticación de Firebase detectado");

      // Si estamos cerrando sesión, no hacer nada
      if (loggingOut.current) {
        console.log("[AuthContext] Proceso de logout en progreso, ignorando cambio de autenticación");
        return;
      }

      // Si hay un login manual en progreso, no interferir con el proceso
      if (manualLoginInProgress.current) {
        console.log("[AuthContext] Login manual en progreso, omitiendo verificación automática");
        authCheckInProgress.current = false;
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
          console.log("[AuthContext] Token válido en localStorage, usuario autenticado");
          authCheckInProgress.current = false;
          return;
        }

        if (firebaseUser) {
          // Limpiar errores anteriores cuando hay un cambio en la autenticación
          clearError();

          // El usuario está autenticado en Firebase
          console.log("[AuthContext] Usuario autenticado en Firebase:", firebaseUser.email);
          console.log("[AuthContext] Email verificado:", firebaseUser.emailVerified);

          // Verificar si el email está verificado
          if (!firebaseUser.emailVerified) {
            console.log("[AuthContext] Email no verificado");
            setError("Por favor verifica tu correo electrónico antes de iniciar sesión");
            setCurrentUser(null);
            setLoading(false);
            authCheckInProgress.current = false;
            return;
          }

          // Si el token no es válido pero el usuario está autenticado en Firebase,
          // intentar obtener un nuevo token
          console.log("[AuthContext] Obteniendo nuevo token para usuario:", firebaseUser.email);

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
            console.log("[AuthContext] Login con Firebase exitoso en AuthContext");
            localStorage.setItem("token", loginResponse.data.token);
            setCurrentUser(loginResponse.data.user);
            clearError(); // Limpiar error en caso de éxito
          } else {
            throw new Error(loginResponse.message);
          }
        } else {
          // El usuario no está autenticado en Firebase ni en el backend
          console.log("[AuthContext] Usuario no autenticado ni en Firebase ni en backend");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("[AuthContext] Error en autenticación:", error);
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
      console.log("[AuthContext] Limpiando observador de autenticación");
      unsubscribe();
      authCheckInProgress.current = false;
    };
  }, []);

  // Función para cerrar sesión
  const logout = async () => {
    console.log("[AuthContext] Iniciando proceso de cierre de sesión");

    try {
      // Marcar que estamos cerrando sesión para evitar efectos secundarios
      loggingOut.current = true;
      setLoading(true);
      setDebugState((prev) => ({ ...prev, lastAction: "Logout iniciado" }));

      // Primero, limpiar localStorage para evitar peticiones con el token antiguo
      localStorage.removeItem("token");

      // Luego, actualizar el estado
      setCurrentUser(null);
      clearError(); // Limpiar errores anteriores

      // Por último, cerrar sesión en Firebase
      if (auth.currentUser) {
        await signOut(auth).catch((e) => console.error("[AuthContext] Error al cerrar sesión en Firebase:", e));
      }

      // Redireccionar a login
      console.log("[AuthContext] Sesión cerrada correctamente, redirigiendo a /auth/login");
      navigate("/auth/login");
    } catch (error) {
      console.error("[AuthContext] Error al cerrar sesión:", error);
      setError("Error al cerrar sesión");
    } finally {
      setLoading(false);
      loggingOut.current = false;
      setDebugState((prev) => ({ ...prev, lastAction: "Logout finalizado" }));
    }
  };

  // Valor del contexto
  const value = {
    currentUser,
    loading,
    error,
    setError,
    clearError,
    isAuthenticated: !!currentUser,
    logout,
    setManualLoginInProgress,
    forceAuthCheck,
    debugState,
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
