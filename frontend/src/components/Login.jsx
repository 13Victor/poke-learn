import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase.config";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
import GoogleButton from "react-google-button";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Estado interno para seguimiento del proceso de login
  const [loginState, setLoginState] = useState("idle");
  const redirectTimer = useRef(null);

  // Estados para la animación de imágenes
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationInterval = useRef(null);

  // Generar array de rutas de las imágenes de la animación (000 a 155)
  const animationFrames = Array.from({ length: 156 }, (_, i) => {
    const frameNumber = i.toString().padStart(3, "0"); // Convierte 0 -> "000", 1 -> "001", etc.
    return `/assets/anim/Mega Rayquaza_${frameNumber}.jpg`;
  });

  const { setError, error, clearError, isAuthenticated, setManualLoginInProgress, forceAuthCheck, debugState } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener la ubicación anterior si existe
  const from = location.state?.from?.pathname || "/user";

  // Efecto para la animación de imágenes
  useEffect(() => {
    if (animationFrames.length > 1) {
      animationInterval.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % animationFrames.length);
      }, 60); // 60ms entre frames = ~16.6 FPS, ajusta según prefieras

      return () => {
        if (animationInterval.current) {
          clearInterval(animationInterval.current);
        }
      };
    }
  }, [animationFrames.length]);

  // Efecto para mostrar el estado de depuración
  useEffect(() => {
    console.log("[Login] Estado de autenticación:", { isAuthenticated, loginState, debugState });
  }, [isAuthenticated, loginState, debugState]);

  // Efecto para redirigir al usuario si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && loginState === "idle") {
      console.log("[Login] Usuario ya autenticado, redirigiendo a:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, loginState]);

  // Efecto para manejar la redirección después del login exitoso
  useEffect(() => {
    if (loginState === "success_waiting") {
      console.log("[Login] Estado de login: success_waiting, preparando redirección...");

      // Limpiar timer anterior si existe
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }

      redirectTimer.current = setTimeout(async () => {
        console.log("[Login] Ejecutando verificación final antes de redirección");

        try {
          // Verificar explícitamente el token antes de redireccionar
          const isAuthValid = await forceAuthCheck();
          console.log("[Login] Resultado de verificación final:", isAuthValid);

          if (isAuthValid) {
            console.log("[Login] Autenticación confirmada, redirigiendo a:", from);
            setLoginState("redirecting");
            navigate(from, { replace: true });
          } else {
            console.log("[Login] La verificación final falló, reiniciando proceso");
            setError("Error de autenticación. Por favor, intenta de nuevo.");
            setLoginState("idle");
            setManualLoginInProgress(false);
          }
        } catch (error) {
          console.error("[Login] Error durante verificación final:", error);
          setError("Error de verificación. Por favor, intenta de nuevo.");
          setLoginState("idle");
          setManualLoginInProgress(false);
        }
      }, 1000);

      // Limpieza del timer en desmontaje
      return () => {
        if (redirectTimer.current) {
          clearTimeout(redirectTimer.current);
        }
      };
    }
  }, [loginState, from, navigate, setError, forceAuthCheck, setManualLoginInProgress]);

  // Limpiar errores y estados al montar el componente
  useEffect(() => {
    console.log("[Login] Componente montado");
    clearError();
    setUnverifiedUser(null);
    setResendSuccess(false);
    setLoginState("idle");

    const checkExistingAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          console.log("[Login] Token encontrado en localStorage, verificando validez");
          // Verificar silenciosamente si hay un token válido
          await apiService.checkAuth();
        }
      } catch (error) {
        console.error("[Login] Error verificando token:", error);
        localStorage.removeItem("token");
      }
    };

    checkExistingAuth();

    // Limpieza al desmontar
    return () => {
      console.log("[Login] Componente desmontado");
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
      // Asegurarse de que el login manual se marca como finalizado si se desmonta el componente
      setManualLoginInProgress(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // [Resto de las funciones permanecen igual...]
  // Función para reenviar el correo de verificación
  const handleResendVerification = async () => {
    if (!unverifiedUser) return;

    setResendLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      setResendSuccess(true);
      setSuccess("A new verification email has been sent to " + unverifiedUser.email);
    } catch (error) {
      console.error("[Login] Error al reenviar verificación:", error);
      if (error.code === "auth/too-many-requests") {
        setError("Too many requests. Wait a few minutes before trying again.");
      } else {
        setError("Error resending verification: " + error.message);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const completeLoginProcess = async (response, userEmail) => {
    try {
      // Guardar token
      localStorage.setItem("token", response.data.token);

      // Verificación inmediata
      const storedToken = localStorage.getItem("token");
      console.log(
        "[Login] Token almacenado:",
        storedToken
          ? `${storedToken.substring(0, 15)}... (longitud: ${storedToken.length})`
          : "No se guardó correctamente"
      );

      setSuccess("Login successful. Redirecting...");
      console.log("[Login] Login exitoso para:", userEmail);

      // Cambiar estado a 'esperando redirección'
      setLoginState("success_waiting");

      // La redirección se maneja en el useEffect
    } catch (error) {
      console.error("[Login] Error en proceso de finalización:", error);
      setError("Error en el proceso de autenticación");
      setLoginState("idle");
      setManualLoginInProgress(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    clearError();
    setSuccess("");
    setDebugInfo("");
    setIsLoading(true);
    setUnverifiedUser(null);
    setResendSuccess(false);
    setLoginState("processing");

    // Indicar que se está realizando un login manual
    setManualLoginInProgress(true);
    console.log("[Login] Iniciando proceso de login con email/password");

    try {
      // 1. Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("[Login] Login exitoso en Firebase:", user.email);
      console.log("[Login] Email verificado:", user.emailVerified);

      // 2. Verificar si el email está verificado
      if (!user.emailVerified) {
        console.log("[Login] Email no verificado, mostrando mensaje");
        // Almacenar el usuario para permitir reenviar la verificación
        setUnverifiedUser(user);
        setError("Please verify your email before signing in");
        setIsLoading(false);
        setManualLoginInProgress(false);
        setLoginState("idle");
        return;
      }

      // Obtener token de Firebase
      console.log("[Login] Obteniendo token de Firebase");
      const idToken = await user.getIdToken();

      // 3. Preparar información de usuario para enviar al backend
      const userInfo = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      console.log("[Login] Enviando información de usuario al backend...");

      // 4. Autenticar en backend con información y token
      const response = await apiService.loginWithFirebase(userInfo, idToken);

      if (!response.success) {
        throw new Error(response.message || "Error del servidor");
      }

      await completeLoginProcess(response, user.email);
    } catch (error) {
      console.error("[Login] Error completo:", error);
      setLoginState("idle");
      setManualLoginInProgress(false);

      // Handle specific Firebase errors
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid credentials");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later or reset your password.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Check your internet connection");
      } else {
        setError(`${error.message || "Unknown error"}`);
      }

      setDebugInfo(`Error code: ${error.code || "N/A"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    setError("");
    setSuccess("");
    setDebugInfo("");
    setGoogleLoading(true);
    setUnverifiedUser(null);
    setResendSuccess(false);
    setLoginState("processing");

    // Indicar que se está realizando un login manual
    setManualLoginInProgress(true);
    console.log("[Login] Iniciando proceso de login con Google");

    try {
      const provider = new GoogleAuthProvider();
      // Configurar para mostrar la pantalla de selección de cuenta cada vez
      provider.setCustomParameters({ prompt: "select_account" });

      // Iniciar sesión con Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Obtener el token de ID de Google
      console.log("[Login] Obteniendo token de Google");
      const idToken = await user.getIdToken();

      // Preparar información del usuario
      const userInfo = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified, // Gmail siempre estará verificado
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      console.log("[Login] Inicio de sesión con Google exitoso:", userInfo.email);

      // Autenticar en el backend
      console.log("[Login] Enviando información de usuario al backend...");
      const response = await apiService.loginWithFirebase(userInfo, idToken);

      if (!response.success) {
        throw new Error(response.message || "Error del servidor");
      }

      await completeLoginProcess(response, user.email);
    } catch (error) {
      console.error("[Login] Error en inicio de sesión con Google:", error);
      setLoginState("idle");
      setManualLoginInProgress(false);

      // If user cancelled popup, don't show error
      if (error.code === "auth/popup-closed-by-user") {
        setDebugInfo("Authentication window closed by user");
      }
      // If account already exists with same email but different method
      else if (error.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email. Try another sign-in method.");
      }
      // Other errors
      else {
        setError(`Error signing in with Google: ${error.message || "Unknown error"}`);
        setDebugInfo(`Error code: ${error.code || "N/A"}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-container">
          <div className="logo-container">
            <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
            <h2>Sign in to your account</h2>
            <p className="subtitle">Get ready for battle!</p>
          </div>

          {/* Sección de usuario no verificado */}
          {unverifiedUser ? (
            <div className="unverified-user-section">
              <p className="error-message">Please verify your email before signing in.</p>
              <p>
                A verification email has been sent to <strong>{unverifiedUser.email}</strong>
              </p>

              {!resendSuccess ? (
                <button onClick={handleResendVerification} disabled={resendLoading} className="resend-button">
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </button>
              ) : (
                <p className="success-message">Verification email resent successfully!</p>
              )}

              <button onClick={() => setUnverifiedUser(null)} className="back-button">
                Back to login
              </button>
            </div>
          ) : (
            /* Formulario de login tradicional */
            <>
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="text"
                    placeholder="trainer@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={
                      isLoading || googleLoading || loginState === "success_waiting" || loginState === "redirecting"
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={
                      isLoading || googleLoading || loginState === "success_waiting" || loginState === "redirecting"
                    }
                  />
                </div>

                <div className="form-options">
                  <div className="remember-me">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">Remember me</label>
                  </div>
                  <Link to="/auth/forgot-password" className="forgot-password">
                    Forgot your password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={
                    isLoading || googleLoading || loginState === "success_waiting" || loginState === "redirecting"
                  }
                  className="login-button"
                >
                  {isLoading
                    ? "Processing..."
                    : loginState === "success_waiting"
                    ? "Verifying..."
                    : loginState === "redirecting"
                    ? "Redirecting..."
                    : "Sign in"}
                </button>
              </form>

              {/* Separador entre métodos de login */}
              <div className="login-separator">
                <span>O</span>
              </div>

              <div className="google-login-container">
                <GoogleButton
                  onClick={handleGoogleLogin}
                  disabled={
                    isLoading || googleLoading || loginState === "success_waiting" || loginState === "redirecting"
                  }
                  label={
                    googleLoading
                      ? "Processing..."
                      : loginState === "success_waiting"
                      ? "Verifying..."
                      : loginState === "redirecting"
                      ? "Redirecting..."
                      : "Sign in with Google"
                  }
                  type="light"
                />
              </div>
            </>
          )}

          {error && !unverifiedUser && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          {debugInfo && <p className="debug-info">{debugInfo}</p>}

          {/* Información de depuración */}
          <div
            className="debug-section"
            style={{ fontSize: "10px", color: "#888", marginTop: "10px", display: "none" }}
          >
            <p>Estado de login: {loginState}</p>
            <p>isAuthenticated: {isAuthenticated ? "true" : "false"}</p>
            <p>Login manual en progreso: {debugState?.manualLoginActive ? "true" : "false"}</p>
            <p>Última acción: {debugState?.lastAction}</p>
            <p>Estado token: {debugState?.lastTokenCheck}</p>
          </div>

          <div className="register-link">
            Don't have an account? <Link to="/auth/register">Sign up</Link>
          </div>
        </div>
      </div>

      <div className="background-container">
        {/* Overlay con animación de imágenes */}
        <div className="overlay">
          <div className="animated-overlay">
            <img
              src={animationFrames[currentFrame]}
              alt="Pokémon Animation"
              className="animation-frame"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 1, // Ajusta la opacidad según necesites
              }}
            />
          </div>
        </div>
        <div className="background-text">
          <h3>Create teams and battle!</h3>
          <p>Build your perfect team, develop strategies and prove you're the best Pokémon trainer.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
