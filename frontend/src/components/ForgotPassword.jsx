import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, passwordResetSettings } from "../firebase.config";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
import "../styles/Login.css"; // Reutilizamos los estilos del login

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Limpiar errores al montar el componente
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/user", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Contador para el botón de reenvío
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validación básica del email
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, ingresa un correo electrónico válido");
      setIsLoading(false);
      return;
    }

    try {
      // Opcional: Verificar con el backend si el usuario existe
      // (esto no es estrictamente necesario, pero puede proporcionar mejor UX)
      try {
        await apiService.requestPasswordReset(email);
      } catch (backendError) {
        // Continuar aunque el backend falle, Firebase manejará la validación
        console.log("Backend check failed, continuing with Firebase:", backendError);
      }

      // Enviar email de restablecimiento de contraseña
      await sendPasswordResetEmail(auth, email, passwordResetSettings);

      setEmailSent(true);
      setSuccess(`Se ha enviado un enlace de restablecimiento de contraseña a ${email}`);
      setCountdown(60); // Contador de 60 segundos para reenvío
    } catch (error) {
      console.error("Error al enviar email de restablecimiento:", error);

      // Manejar errores específicos de Firebase
      switch (error.code) {
        case "auth/user-not-found":
          setError("No existe una cuenta con este correo electrónico");
          break;
        case "auth/invalid-email":
          setError("El formato del correo electrónico no es válido");
          break;
        case "auth/too-many-requests":
          setError("Demasiadas solicitudes. Intenta de nuevo más tarde");
          break;
        case "auth/network-request-failed":
          setError("Error de conexión. Verifica tu conexión a internet");
          break;
        default:
          setError(`Error al enviar correo: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setError("");
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, passwordResetSettings);

      setSuccess("Correo de restablecimiento reenviado con éxito");
      setCountdown(60);
    } catch (error) {
      console.error("Error al reenviar email:", error);
      setError(`Error al reenviar correo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-container">
          <div className="logo-container">
            <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
            <h2>Restablecer Contraseña</h2>
            <p className="subtitle">
              {emailSent ? "Revisa tu correo electrónico" : "Ingresa tu correo para restablecer tu contraseña"}
            </p>
          </div>

          {!emailSent ? (
            // Formulario para solicitar restablecimiento
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="trainer@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <button type="submit" disabled={isLoading} className="login-button">
                {isLoading ? "Enviando..." : "Enviar enlace de restablecimiento"}
              </button>
            </form>
          ) : (
            // Información después de enviar el email
            <div className="reset-email-sent">
              <div className="success-message">
                <p>{success}</p>
              </div>

              <div className="reset-instructions">
                <h4>¿Qué hacer ahora?</h4>
                <ol>
                  <li>
                    Revisa tu bandeja de entrada en <strong>{email}</strong>
                  </li>
                  <li>Busca un correo de "Firebase" o "noreply@firebase.com"</li>
                  <li>Haz clic en el enlace "Restablecer contraseña"</li>
                  <li>Crea una nueva contraseña segura</li>
                  <li>Regresa aquí para iniciar sesión</li>
                </ol>

                <div
                  className="tip-box"
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#f0f8ff",
                    border: "1px solid #add8e6",
                    borderRadius: "5px",
                  }}
                >
                  <p>
                    <strong>💡 Consejo:</strong> Si no encuentras el correo, revisa tu carpeta de spam o correo no
                    deseado.
                  </p>
                </div>
              </div>

              <div className="resend-section" style={{ marginTop: "20px" }}>
                {countdown === 0 ? (
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="resend-button"
                    style={{
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    {isLoading ? "Reenviando..." : "Reenviar correo"}
                  </button>
                ) : (
                  <button
                    disabled={true}
                    className="resend-button disabled"
                    style={{
                      backgroundColor: "#e9ecef",
                      color: "#6c757d",
                      border: "1px solid #dee2e6",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      cursor: "not-allowed",
                    }}
                  >
                    Reenviar en {countdown} segundos
                  </button>
                )}
              </div>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <div className="navigation-links" style={{ marginTop: "20px", textAlign: "center" }}>
            <Link to="/auth/login" className="login-link">
              ← Volver a iniciar sesión
            </Link>
            <span style={{ margin: "0 10px", color: "#ccc" }}>|</span>
            <Link to="/auth/register" className="register-link">
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        </div>
      </div>

      <div className="background-container">
        <div className="overlay"></div>
        <img src="/pokemon-battle-background.png" alt="Pokémon Battle" className="background-image" />
        <div className="background-text">
          <h3>¡Recupera tu cuenta!</h3>
          <p>
            No te preocupes, todos perdemos nuestras contraseñas de vez en cuando. Te ayudaremos a recuperar el acceso a
            tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
