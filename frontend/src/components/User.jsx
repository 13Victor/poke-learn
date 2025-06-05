import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
import "../styles/User.css";

function User() {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { currentUser, isAuthenticated, logout, error: authError, setError, clearError } = useAuth();
  const [error, setLocalError] = useState("");
  const navigate = useNavigate();

  // Reference to control if component is mounted
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    // Clear errors on mount
    clearError();

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      // Don't make the call if not authenticated or if we already have auth error
      if (!isAuthenticated || authError) {
        setLoading(false);
        return;
      }

      try {
        // Get additional user data if needed
        const response = await apiService.getUserProfile();

        // Check if component is still mounted before updating state
        if (isMounted.current) {
          setLoading(false);

          if (!response.success) {
            throw new Error(response.message);
          }
        }
      } catch (error) {
        console.error("Error getting user data:", error);

        // Only update states if component is still mounted
        if (isMounted.current) {
          setLocalError(error.message);
          setLoading(false);

          // If there's an authorization error, redirect to login after some time
          if (
            error.message.includes("authorized") ||
            error.message.includes("session") ||
            error.message.includes("token") ||
            error.message.includes("expired")
          ) {
            // Clear authentication information
            localStorage.removeItem("token");
            setError("Your session has expired. Please sign in again.");

            // Use setTimeout to give time for other effects to execute
            setTimeout(() => {
              if (isMounted.current) {
                navigate("/auth/login");
              }
            }, 2000);
          }
        }
      }
    };

    fetchUserData();
  }, [isAuthenticated, navigate, setError, authError, clearError]);

  const handleLogout = async () => {
    // Mark component as unmounted before logout
    // to avoid updating states after navigation
    isMounted.current = false;
    await logout();
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Close modal when clicking outside
  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeModal();
    }
  };

  if (loading) {
    return <div className="loading">Loading user information...</div>;
  }

  return (
    <div className="user-container">
      {error && <p className="error-message">{error}</p>}
      {authError && <p className="error-message">{authError}</p>}

      {currentUser ? (
        <div className="user-profile">
          <div className="profile-preview" onClick={openModal}>
            {currentUser.profile_picture ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/profile_pictures/${currentUser.profile_picture}`}
                alt="Profile picture"
                className="profile-image-small"
              />
            ) : (
              <div className="no-image-small">
                <span className="user-initial">{currentUser.user_name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="profile-name">{currentUser.user_name}</span>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={handleModalClick}>
              <div className="modal-content">
                <button className="modal-close" onClick={closeModal}>
                  ×
                </button>

                <div className="modal-profile">
                  <div className="profile-image-large">
                    {currentUser.profile_picture ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}/uploads/profile_pictures/${
                          currentUser.profile_picture
                        }`}
                        alt="Profile picture"
                      />
                    ) : (
                      <div className="no-image-large">
                        <span className="user-initial-large">{currentUser.user_name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  <div className="profile-info">
                    <h3>{currentUser.user_name}</h3>
                    <p className="email">{currentUser.email}</p>
                    <button className="logout-button" onClick={handleLogout}>
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="not-authenticated">
          <p>You haven't signed in or your session has expired.</p>
          <button className="login-button" onClick={() => navigate("/auth/login")}>
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
}

export default User;
