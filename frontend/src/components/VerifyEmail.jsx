import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase.config";
import { sendEmailVerification } from "firebase/auth";
import "../styles/Login.css";

function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [sentAgain, setSentAgain] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Animation states
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationInterval = useRef(null);

  // Generate animation frames array (000 to 155)
  const animationFrames = Array.from({ length: 156 }, (_, i) => {
    const frameNumber = i.toString().padStart(3, "0");
    return `/assets/anim/Mega Rayquaza_${frameNumber}.jpg`;
  });

  const { clearError } = useAuth();
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

  // Get current user's email
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setEmail(currentUser.email);
      console.log("User in VerifyEmail:", currentUser.email);
      console.log("Email verified:", currentUser.emailVerified);

      // If email is already verified, redirect to /user
      if (currentUser.emailVerified) {
        navigate("/user", { replace: true });
      }
    } else {
      console.log("No authenticated user in VerifyEmail");
      setError("No active session. Please sign in again.");
    }
  }, [navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      setError("No active session. Please sign in again.");
      setTimeout(() => navigate("/auth/login"), 3000);
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSentAgain(true);
      setError("");
      // Start wait timer for resend (60 seconds)
      setCountdown(60);
    } catch (error) {
      console.error("Error resending verification:", error);

      if (error.code === "auth/too-many-requests") {
        setError("You've sent too many requests. Please wait a few minutes before trying again.");
      } else {
        setError(`Error sending verification email: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setLoading(true);

      // Force reload current user
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        console.log("Email verified successfully!");
        navigate("/user", { replace: true });
      } else {
        setError("Your email has not been verified yet. Please check your inbox.");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setError(`Error checking status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-container">
          <div className="logo-container">
            <img src="/assets/logo.png" alt="Pokémon Battle App" className="pokemon-logo" />
            <h2>Email Verification</h2>
            <p className="subtitle">Check your inbox to continue</p>
          </div>

          <div className="verify-email-content">
            <p>
              A verification email has been sent to: <strong>{email || "your email address"}</strong>
            </p>

            <p>Please check your inbox and click the verification link to complete your registration.</p>

            <div
              className="tip-box"
              style={{
                marginTop: "15px",
                padding: "15px",
                backgroundColor: "#f0f8ff",
                border: "1px solid #add8e6",
                borderRadius: "8px",
              }}
            >
              <p>
                <strong>💡 Tip:</strong> If you can't find the email in your inbox, check your spam or junk mail folder.
              </p>
            </div>

            <div className="action-buttons" style={{ marginTop: "20px" }}>
              {countdown === 0 ? (
                <button
                  onClick={handleResendVerification}
                  disabled={loading || !auth.currentUser}
                  className="resend-button"
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  {loading ? "Sending..." : "Resend verification email"}
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
                    marginRight: "10px",
                  }}
                >
                  Resend in {countdown} seconds
                </button>
              )}

              <button
                onClick={handleRefreshStatus}
                disabled={loading}
                className="refresh-button"
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                {loading ? "Checking..." : "I've verified my email"}
              </button>
            </div>

            {sentAgain && (
              <div className="success-message" style={{ marginTop: "15px" }}>
                <p>Email resent successfully! Please check your inbox.</p>
              </div>
            )}

            {error && (
              <p className="error-message" style={{ marginTop: "15px" }}>
                {error}
              </p>
            )}

            <div className="navigation-links" style={{ marginTop: "20px", textAlign: "center" }}>
              <Link to="/auth/login" className="login-link">
                Back to sign in
              </Link>
            </div>
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
          <h3>Almost there!</h3>
          <p>Just one more step to join the adventure. Verify your email and start your Pokémon journey!</p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
