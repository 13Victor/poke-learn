import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";
import { FaCheck } from "react-icons/fa6";
import { MdOutlineCancel } from "react-icons/md";
import "../styles/User.css";
import { RiEditLine } from "react-icons/ri";
import { IoClose } from "react-icons/io5";

function User() {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [localUserData, setLocalUserData] = useState(null); // Local state for user data
  const { currentUser, isAuthenticated, logout, error: authError, setError, clearError, updateUserData } = useAuth();
  const [error, setLocalError] = useState("");
  const navigate = useNavigate();

  // Reference to control if component is mounted
  const isMounted = useRef(true);

  // Use local user data if available, fallback to context user data
  const displayUser = localUserData || currentUser;

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

          // Update local user data
          if (response.data?.user) {
            setLocalUserData(response.data.user);
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
    setIsEditingName(false);
    setNewUserName("");
    setLocalError("");
  };

  // Close modal when clicking outside
  const handleModalClick = (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeModal();
    }
  };

  const startEditingName = () => {
    setIsEditingName(true);
    setNewUserName(displayUser.user_name);
    setLocalError("");
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setNewUserName("");
    setLocalError("");
  };

  const saveUserName = async () => {
    if (!newUserName.trim()) {
      setLocalError("Username cannot be empty");
      return;
    }

    if (newUserName.trim() === displayUser.user_name) {
      setIsEditingName(false);
      setNewUserName("");
      return;
    }

    setIsUpdating(true);
    setLocalError("");

    try {
      const response = await apiService.updateUserProfile({ user_name: newUserName.trim() });

      if (response.success) {
        // Get updated user data from the server to ensure consistency
        const updatedUserResponse = await apiService.getUserProfile();

        if (updatedUserResponse.success && updatedUserResponse.data?.user) {
          // Update local state immediately
          setLocalUserData(updatedUserResponse.data.user);

          // Also try to update the auth context if the method exists
          if (updateUserData) {
            updateUserData(updatedUserResponse.data.user);
          }
        }

        setIsEditingName(false);
        setNewUserName("");
      } else {
        throw new Error(response.message || "Failed to update username");
      }
    } catch (error) {
      console.error("Error updating username:", error);
      setLocalError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      saveUserName();
    } else if (e.key === "Escape") {
      cancelEditingName();
    }
  };

  if (loading) {
    return <div className="loading">Loading user information...</div>;
  }

  return (
    <div className="user-container">
      {error && <p className="error-message">{error}</p>}
      {authError && <p className="error-message">{authError}</p>}

      {displayUser ? (
        <div className="user-profile">
          <div className="profile-preview" onClick={openModal}>
            {displayUser.profile_picture ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/uploads/profile_pictures/${displayUser.profile_picture}`}
                alt="Profile picture"
                className="profile-image-small"
              />
            ) : (
              <div className="no-image-small">
                <span className="user-initial">{displayUser.user_name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="profile-name">{displayUser.user_name}</span>
          </div>

          {/* Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={handleModalClick}>
              <div className="modal-content">
                <button className="modal-close" onClick={closeModal}>
                  <IoClose />
                </button>

                <div className="modal-profile">
                  <div className="profile-image-large">
                    {displayUser.profile_picture ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}/uploads/profile_pictures/${
                          displayUser.profile_picture
                        }`}
                        alt="Profile picture"
                      />
                    ) : (
                      <div className="no-image-large">
                        <span className="user-initial-large">{displayUser.user_name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  <div className="profile-info">
                    <div className="username-section">
                      {isEditingName ? (
                        <div className="username-edit">
                          <input
                            type="text"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="username-input"
                            disabled={isUpdating}
                            autoFocus
                          />
                          <div className="username-actions">
                            <button onClick={saveUserName} disabled={isUpdating} className="save-button" title="Save">
                              {isUpdating ? "..." : <FaCheck />}
                            </button>
                            <button
                              onClick={cancelEditingName}
                              disabled={isUpdating}
                              className="cancel-button"
                              title="Cancel"
                            >
                              <IoClose />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="username-display">
                          <h3>{displayUser.user_name}</h3>
                          <button onClick={startEditingName} className="edit-button" title="Edit username">
                            <RiEditLine />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="email">{displayUser.email}</p>

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
