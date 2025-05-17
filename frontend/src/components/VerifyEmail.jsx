import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase.config";
import { sendEmailVerification } from "firebase/auth";

function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [sentAgain, setSentAgain] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { clearError } = useAuth();
  const navigate = useNavigate();

  // Limpiar errores al montar componente
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Obtener email del usuario actual
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setEmail(currentUser.email);
      console.log("Usuario en VerifyEmail:", currentUser.email);
      console.log("Email verificado:", currentUser.emailVerified);

      // Si el email ya está verificado, redirigir a /user
      if (currentUser.emailVerified) {
        navigate("/user", { replace: true });
      }
    } else {
      console.log("No hay usuario autenticado en VerifyEmail");
      setError("No hay una sesión activa. Por favor, inicia sesión nuevamente.");
    }
  }, [navigate]);

  // Contador para el botón de reenvío
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      setError("No hay una sesión activa. Por favor, inicia sesión nuevamente.");
      setTimeout(() => navigate("/auth/login"), 3000);
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSentAgain(true);
      setError("");
      // Iniciar contador de espera para reenvío (60 segundos)
      setCountdown(60);
    } catch (error) {
      console.error("Error al reenviar verificación:", error);

      if (error.code === "auth/too-many-requests") {
        setError("Has enviado demasiadas solicitudes. Por favor, espera unos minutos antes de intentarlo de nuevo.");
      } else {
        setError(`Error al enviar correo de verificación: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setLoading(true);

      // Forzar recarga del usuario actual
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        console.log("¡Email verificado correctamente!");
        navigate("/user", { replace: true });
      } else {
        setError("Tu email aún no ha sido verificado. Por favor, revisa tu bandeja de entrada.");
      }
    } catch (error) {
      console.error("Error al verificar estado:", error);
      setError(`Error al verificar estado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h2>Verificación de correo electrónico</h2>

        <div className="verify-email-content">
          <p>
            Se ha enviado un correo de verificación a: <strong>{email || "tu correo electrónico"}</strong>
          </p>

          <p>
            Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación para completar tu registro.
          </p>

          <div className="tip-box">
            <p>
              <strong>Consejo:</strong> Si no encuentras el correo en tu bandeja de entrada, revisa la carpeta de spam o
              correo no deseado.
            </p>
          </div>

          <div className="action-buttons">
            {countdown === 0 ? (
              <button
                onClick={handleResendVerification}
                disabled={loading || !auth.currentUser}
                className="resend-button"
              >
                {loading ? "Enviando..." : "Reenviar correo de verificación"}
              </button>
            ) : (
              <button disabled={true} className="resend-button disabled">
                Reenviar en {countdown} segundos
              </button>
            )}

            <button onClick={handleRefreshStatus} disabled={loading} className="refresh-button">
              {loading ? "Verificando..." : "He verificado mi correo"}
            </button>
          </div>

          {sentAgain && (
            <div className="success-message">
              <p>¡Correo reenviado con éxito! Por favor, revisa tu bandeja de entrada.</p>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <div className="navigation-links">
            <Link to="/auth/login" className="login-link">
              Volver a inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
