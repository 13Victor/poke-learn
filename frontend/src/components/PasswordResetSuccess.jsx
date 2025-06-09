import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Login.css";

function PasswordResetSuccess() {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5000);
  const { isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const apiKey = searchParams.get("apiKey");
  const continueUrl = searchParams.get("continueUrl");

  // Estado interno para seguimiento del proceso de login
  const [loginState, setLoginState] = useState("idle");
  const redirectTimer = useRef(null);

  const location = useLocation();

  // Obtener la ubicación anterior si existe
  const from = location.state?.from?.pathname || "/user";

  // Clear errors on mount
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/user", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Countdown for automatic redirection
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Automatically redirect to login after countdown
      navigate("/auth/login", { replace: true });
    }
  }, [countdown, navigate]);

  // Verify if it's a valid redirect from Firebase
  // Can come with mode=resetPassword or simply from continueUrl
  const isValidPasswordReset =
    (mode === "resetPassword" && oobCode) || // Standard flow
    continueUrl || // Continue URL from Firebase
    (apiKey && window.location.pathname === "/auth/reset-success"); // Direct redirect

  // If we arrive at this page directly (without parameters), assume it's valid
  // because the user was redirected here after changing their password
  const isDirectAccess = !mode && !oobCode && !apiKey && !continueUrl;

  if (!isValidPasswordReset && !isDirectAccess) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="form-container">
            <div className="logo-container">
              <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
              <h2>Invalid Link</h2>
              <p className="subtitle">This link is invalid or has expired</p>
            </div>

            <div className="invalid-link-message">
              <p className="error-message">The password reset link is invalid or has expired.</p>
              <p>If you need to reset your password, please request a new link.</p>
            </div>

            <div className="navigation-links" style={{ marginTop: "20px", textAlign: "center" }}>
              <Link to="/auth/forgot-password" className="reset-link">
                Request new link
              </Link>
              <span style={{ margin: "0 10px", color: "#ccc" }}>|</span>
              <Link to="/auth/login" className="login-link">
                Back to login
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
            <h2>Password Updated!</h2>
            <p className="subtitle">Your password has been reset successfully</p>
          </div>

          <div className="success-message-container">
            <div className="success-message">
              <h4>✅ Perfect!</h4>
              <p>Your password has been updated correctly.</p>
              <p>You can now log in with your new password.</p>
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
                You will be automatically redirected to login in <strong>{countdown}</strong> second
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
                Go to login now
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
              <h5 style={{ margin: "0 0 10px 0", color: "#856404" }}>💡 Security tips:</h5>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#856404" }}>
                <li>Use a unique password that you don't use on other sites</li>
                <li>Consider using a password manager</li>
                <li>Never share your password with anyone</li>
                <li>If you suspect your account is compromised, change your password immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="background-container">
        <div className="overlay">
          <div className="animated-overlay">
            <img
              src="/assets/anim/Mega Rayquaza_000.jpg"
              alt="Pokémon Background"
              className="animation-frame"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 1,
              }}
            />
          </div>
        </div>
        <div className="background-text">
          <h3>Welcome back!</h3>
          <p>Your account is secure. Continue your Pokémon adventure with complete peace of mind.</p>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetSuccess;
