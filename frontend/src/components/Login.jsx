import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase.config";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
import GoogleButton from "react-google-button"; // Puedes instalar este paquete o crear tu propio botón

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { setError, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener la ubicación anterior si existe
  const from = location.state?.from?.pathname || "/user";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setDebugInfo("");
    setIsLoading(true);

    try {
      // 1. Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("Login exitoso en Firebase:", user.email);
      console.log("Email verificado:", user.emailVerified);

      // 2. Verificar si el email está verificado
      if (!user.emailVerified) {
        setError("Por favor verifica tu correo electrónico antes de iniciar sesión");
        await sendEmailVerification(user);
        setSuccess("Se ha enviado un nuevo correo de verificación");
        setIsLoading(false);
        return;
      }

      // Obtener token de Firebase
      const idToken = await user.getIdToken();

      // 3. Preparar información de usuario para enviar al backend
      const userInfo = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      console.log("Enviando información de usuario al backend...");

      // 4. Autenticar en backend con información y token
      const response = await apiService.loginWithFirebase(userInfo, idToken);

      if (!response.success) {
        throw new Error(response.message || "Error del servidor");
      }

      // Guardar token
      localStorage.setItem("token", response.data.token);

      // Verificación inmediata
      const storedToken = localStorage.getItem("token");
      console.log(
        "Token almacenado:",
        storedToken
          ? `${storedToken.substring(0, 15)}... (longitud: ${storedToken.length})`
          : "No se guardó correctamente"
      );

      setSuccess("Login exitoso. Redirigiendo...");

      // Redirigir a la página anterior o a /user por defecto
      setTimeout(() => navigate(from, { replace: true }), 2000);
    } catch (error) {
      console.error("Error completo:", error);

      // Manejar errores específicos de Firebase
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Credenciales incorrectas");
      } else if (error.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Error de red. Verifica tu conexión a internet");
      } else {
        setError(`${error.message || "Error desconocido"}`);
      }

      setDebugInfo(`Código de error: ${error.code || "N/A"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setDebugInfo("");
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      // Configurar para mostrar la pantalla de selección de cuenta cada vez
      provider.setCustomParameters({ prompt: "select_account" });

      // Iniciar sesión con Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Obtener el token de ID de Google
      const idToken = await user.getIdToken();

      // Preparar información del usuario
      const userInfo = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified, // Gmail siempre estará verificado
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      console.log("Inicio de sesión con Google exitoso:", userInfo.email);

      // Autenticar en el backend
      const response = await apiService.loginWithFirebase(userInfo, idToken);

      if (!response.success) {
        throw new Error(response.message || "Error del servidor");
      }

      // Guardar token
      localStorage.setItem("token", response.data.token);

      setSuccess("Inicio de sesión con Google exitoso. Redirigiendo...");
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (error) {
      console.error("Error en inicio de sesión con Google:", error);

      // Si el usuario canceló el popup, no mostrar error
      if (error.code === "auth/popup-closed-by-user") {
        setDebugInfo("Ventana de autenticación cerrada por el usuario");
      }
      // Si ya existe una cuenta con el mismo email pero otro método
      else if (error.code === "auth/account-exists-with-different-credential") {
        setError("Ya existe una cuenta con este email. Intenta otro método de inicio de sesión.");
      }
      // Otros errores
      else {
        setError(`Error al iniciar sesión con Google: ${error.message || "Error desconocido"}`);
        setDebugInfo(`Código de error: ${error.code || "N/A"}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
        <h3>Login</h3>

        {/* Formulario de login tradicional */}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading || googleLoading}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading || googleLoading}
          />
          <input
            type="submit"
            value={isLoading ? "Procesando..." : "Login"}
            disabled={isLoading || googleLoading}
            className="login-button"
          />
        </form>

        {/* Separador entre métodos de login */}
        <div className="login-separator">
          <span>O</span>
        </div>

        {/* Botón de login con Google */}
        <div className="google-login-container">
          {/* Si usas react-google-button */}
          <GoogleButton
            onClick={handleGoogleLogin}
            disabled={isLoading || googleLoading}
            label={googleLoading ? "Procesando..." : "Iniciar sesión con Google"}
            type="light" // o "dark" para tema oscuro
          />
        </div>

        {/* Herramientas de debug */}
        <div className="debug-tools">
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              console.log("localStorage limpiado");
              alert("localStorage limpiado. Intenta iniciar sesión de nuevo.");
            }}
          >
            Limpiar localStorage
          </button>
          <button
            type="button"
            onClick={() => {
              const token = localStorage.getItem("token");
              console.log("Token actual:", token);
              alert(token ? `Token encontrado: ${token.substring(0, 20)}...` : "No hay token");
            }}
          >
            Verificar token
          </button>
        </div>

        {/* Mensajes de estado */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        {debugInfo && (
          <p className="debug-info">
            <strong>Debug:</strong> {debugInfo}
          </p>
        )}
      </div>

      <div className="register-link">
        ¿No tienes una cuenta? <Link to="/auth/register">Regístrate</Link>
      </div>
    </>
  );
}

export default Login;
