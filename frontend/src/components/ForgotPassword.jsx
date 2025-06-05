import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, passwordResetSettings } from "../firebase.config";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
import "../styles/Login.css"; // Reusing login styles

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Animation states
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationInterval = useRef(null);

  // Generate animation frames array (000 to 155)
  const animationFrames = Array.from({ length: 156 }, (_, i) => {
    const frameNumber = i.toString().padStart(3, "0");
    return `/assets/anim/Mega Rayquaza_${frameNumber}.jpg`;
  });

  const { clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Animation effect
  useEffect(() => {
    if (animationFrames.length > 1) {
      animationInterval.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % animationFrames.length);
      }, 60);

      return () => {
        if (animationInterval.current) {
          clearInterval(animationInterval.current);
        }
      };
    }
  }, [animationFrames.length]);

  // Clear errors on mount
  useEffect(() => {
    clearError();

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/user", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for resend button
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

    // Basic email validation
    if (!email) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      // Optional: Check with backend if user exists
      try {
        await apiService.requestPasswordReset(email);
      } catch (backendError) {
        // Continue even if backend fails, Firebase will handle validation
        console.log("Backend check failed, continuing with Firebase:", backendError);
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email, passwordResetSettings);

      setEmailSent(true);
      setSuccess(`A password reset link has been sent to ${email}`);
      setCountdown(60); // 60 second countdown for resend
    } catch (error) {
      console.error("Error sending password reset email:", error);

      // Handle specific Firebase errors
      switch (error.code) {
        case "auth/user-not-found":
          setError("No account exists with this email address");
          break;
        case "auth/invalid-email":
          setError("The email address format is not valid");
          break;
        case "auth/too-many-requests":
          setError("Too many requests. Please try again later");
          break;
        case "auth/network-request-failed":
          setError("Connection error. Please check your internet connection");
          break;
        default:
          setError(`Error sending email: ${error.message}`);
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

      setSuccess("Password reset email resent successfully");
      setCountdown(60);
    } catch (error) {
      console.error("Error resending email:", error);
      setError(`Error resending email: ${error.message}`);
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
            <h2>Reset Password</h2>
            <p className="subtitle">{emailSent ? "Check your email" : "Enter your email to reset your password"}</p>
          </div>

          {!emailSent ? (
            // Form to request password reset
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
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
                {isLoading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          ) : (
            // Information after sending email
            <div className="reset-email-sent">
              <div className="success-message">
                <p>{success}</p>
              </div>

              <div className="reset-instructions">
                <h4>What to do now?</h4>
                <ol>
                  <li>
                    Check your inbox at <strong>{email}</strong>
                  </li>
                  <li>Look for an email from "Firebase" or "noreply@firebase.com"</li>
                  <li>Click on the "Reset password" link</li>
                  <li>Create a new secure password</li>
                  <li>Return here to sign in</li>
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
                    <strong>💡 Tip:</strong> If you can't find the email, check your spam or junk mail folder.
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
                      width: "100%",
                    }}
                  >
                    {isLoading ? "Resending..." : "Resend email"}
                  </button>
                ) : (
                  <button
                    disabled={true}
                    className="resend-button disabled"
                    style={{
                      backgroundColor: "#e9ecef",
                      color: "#6c757d",
                      width: "100%",
                      border: "1px solid #dee2e6",
                      padding: "10px 20px",
                      borderRadius: "5px",
                      cursor: "not-allowed",
                    }}
                  >
                    Resend in {countdown} seconds
                  </button>
                )}
              </div>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <div className="navigation-links" style={{ marginTop: "20px", textAlign: "center" }}>
            <Link to="/auth/login" className="login-link">
              ← Back to sign in
            </Link>
            <span style={{ margin: "0 10px", color: "#ccc" }}>|</span>
            <Link to="/auth/register" className="register-link">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>

      <div className="background-container">
        {/* Overlay with image animation */}
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
              }}
            />
          </div>
        </div>
        <div className="background-text">
          <h3>Recover your account!</h3>
          <p>Don't worry, we all lose our passwords from time to time. We'll help you regain access to your account.</p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
