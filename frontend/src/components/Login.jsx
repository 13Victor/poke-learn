import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase.config";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

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

      // Obtener token de Firebase para mayor seguridad
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
      const response = await fetch("http://localhost:5000/auth/login-firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_info: userInfo,
          firebase_token: idToken,
        }),
      });

      const data = await response.json();
      console.log("Respuesta del backend:", data);

      if (!response.ok) {
        throw new Error(data.message || "Error del servidor");
      }

      // IMPORTANTE: Extraer el token de la estructura correcta
      let tokenToStore = null;

      // Verificar todas las posibles ubicaciones del token
      if (data.data && data.data.token) {
        tokenToStore = data.data.token;
        console.log("Token encontrado en data.data.token");
      } else if (data.token) {
        tokenToStore = data.token;
        console.log("Token encontrado en data.token");
      }

      if (!tokenToStore) {
        console.error("No se encontró token en la respuesta:", data);
        throw new Error("No se recibió token del servidor");
      }

      console.log("Token a guardar:", tokenToStore.substring(0, 15) + "...");

      // LIMPIAR localStorage antes de guardar
      localStorage.clear();

      // Guardar token
      localStorage.setItem("token", tokenToStore);

      // Verificación inmediata
      const storedToken = localStorage.getItem("token");
      console.log(
        "Token almacenado:",
        storedToken
          ? `${storedToken.substring(0, 15)}... (longitud: ${storedToken.length})`
          : "No se guardó correctamente"
      );

      setSuccess("Login exitoso. Redirigiendo...");
      setTimeout(() => navigate("/user"), 2000);
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

  return (
    <>
      <div>
        <h3>Login</h3>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
          />
          <input type="submit" value={isLoading ? "Procesando..." : "Login"} disabled={isLoading} />
        </form>
        <div className="debug-tools" style={{ marginTop: "15px" }}>
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              console.log("localStorage limpiado");
              alert("localStorage limpiado. Intenta iniciar sesión de nuevo.");
            }}
            style={{ padding: "5px 10px", background: "#f0f0f0", marginRight: "10px" }}
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
            style={{ padding: "5px 10px", background: "#f0f0f0" }}
          >
            Verificar token
          </button>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        {debugInfo && (
          <p style={{ color: "blue", fontSize: "0.8em" }}>
            <strong>Debug:</strong> {debugInfo}
          </p>
        )}
      </div>
      <Link to="/auth/register">Ir a Register</Link>
    </>
  );
}

export default Login;
