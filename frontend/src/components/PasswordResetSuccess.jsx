import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Login.css";

function PasswordResetSuccess() {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const { isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  // Limpiar errores al montar
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

  // Contador para redirección automática
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirigir automáticamente al login después del countdown
      navigate("/auth/login", { replace: true });
    }
  }, [countdown, navigate]);

  // Verificar si es una acción de reset de contraseña válida
  const isValidPasswordReset = mode === "resetPassword" && oobCode;

  if (!isValidPasswordReset) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="form-container">
            <div className="logo-container">
              <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
              <h2>Enlace inválido</h2>
              <p className="subtitle">Este enlace no es válido o ha expirado</p>
            </div>

            <div className="invalid-link-message">
              <p className="error-message">El enlace de restablecimiento de contraseña no es válido o ha expirado.</p>
              <p>Si necesitas restablecer tu contraseña, solicita un nuevo enlace.</p>
            </div>

            <div className="navigation-links" style={{ marginTop: "20px", textAlign: "center" }}>
              <Link to="/auth/forgot-password" className="reset-link">
                Solicitar nuevo enlace
              </Link>
              <span style={{ margin: "0 10px", color: "#ccc" }}>|</span>
              <Link to="/auth/login" className="login-link">
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-container">
          <div className="logo-container">
            <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
            <h2>¡Contraseña actualizada!</h2>
            <p className="subtitle">Tu contraseña ha sido restablecida exitosamente</p>
          </div>

          <div className="success-message-container">
            <div className="success-message">
              <h4>✅ ¡Perfecto!</h4>
              <p>Tu contraseña ha sido actualizada correctamente.</p>
              <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            </div>

            <div
              className="auto-redirect-info"
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#e8f4f8",
                border: "1px solid #b8e6f0",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <p>
                Serás redirigido automáticamente al login en <strong>{countdown}</strong> segundo
                {countdown !== 1 ? "s" : ""}...
              </p>
            </div>

            <div className="action-buttons" style={{ marginTop: "20px", textAlign: "center" }}>
              <Link
                to="/auth/login"
                className="login-button"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: "#007bff",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  transition: "background-color 0.3s",
                }}
              >
                Ir a iniciar sesión ahora
              </Link>
            </div>

            <div
              className="security-tips"
              style={{
                marginTop: "25px",
                padding: "15px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "8px",
              }}
            >
              <h5 style={{ margin: "0 0 10px 0", color: "#856404" }}>💡 Consejos de seguridad:</h5>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#856404" }}>
                <li>Usa una contraseña única que no uses en otros sitios</li>
                <li>Considera usar un gestor de contraseñas</li>
                <li>No compartas tu contraseña con nadie</li>
                <li>Si sospechas que tu cuenta está comprometida, cambia tu contraseña inmediatamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="background-container">
        <div className="overlay"></div>
        <img src="/pokemon-battle-background.png" alt="Pokémon Battle" className="background-image" />
        <div className="background-text">
          <h3>¡Bienvenido de vuelta!</h3>
          <p>Tu cuenta está segura. Continúa tu aventura Pokémon con total tranquilidad.</p>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetSuccess;
