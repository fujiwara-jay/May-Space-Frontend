import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../cssfiles/Home.css";

function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showRegisterModal) return;

    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminUnlocked(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      setAdminUnlocked(false);
    };
  }, [showRegisterModal]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Username and password are required");
      setIsLoading(false);
      return;
    }

    try {
      const userResponse = await fetch("https://may-space-backend.onrender.com/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: trimmedUsername, 
          password: trimmedPassword 
        }),
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const user = userData.user;
        
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userType", "user");
        localStorage.setItem("username", user.username || trimmedUsername);
        
        navigate("/unitfinder", { 
          state: { userId: user.id, userType: "user" } 
        });
        return;
      }

      const adminResponse = await fetch("https://may-space-backend.onrender.com/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: trimmedUsername, 
          password: trimmedPassword 
        }),
      });
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        const admin = adminData.admin;
        
        localStorage.setItem("userId", admin.id);
        localStorage.setItem("userType", "admin");
        localStorage.setItem("username", admin.username || trimmedUsername);
        
        navigate("/admin-dashboard", { 
          state: { userId: admin.id, userType: "admin" } 
        });
        return;
      }

      setError("Invalid username or password. Please try again.");

    } catch (error) {
      console.error("Login error:", error);
      if (error.name === "TypeError" || error.message.includes("Network")) {
        setError("Failed to connect to the server. Please check your internet connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [username, password, navigate]);

  const handleGuestLogin = useCallback(() => {
    localStorage.setItem("userId", "guest");
    localStorage.setItem("userType", "guest");
    localStorage.setItem("username", "Guest");
    navigate("/unitfinder");
  }, [navigate]);

  const handleAboutClick = useCallback(() => {
    navigate("/about");
  }, [navigate]);
  
  const handleRegisterAsUser = useCallback(() => { 
    setShowRegisterModal(false); 
    setAdminUnlocked(false);
    navigate("/register/user"); 
  }, [navigate]);
  
  const handleRegisterAsAdmin = useCallback(() => { 
    setShowRegisterModal(false); 
    setAdminUnlocked(false);
    navigate("/register/admin"); 
  }, [navigate]);

  const handleInputChange = useCallback((setter) => (e) => { 
    if (error) setError(""); 
    setter(e.target.value); 
  }, [error]);

  const handleCloseModal = useCallback(() => {
    setShowRegisterModal(false);
    setAdminUnlocked(false);
  }, []);

  const handleOpenRegisterModal = useCallback(() => {
    setShowRegisterModal(true);
    setAdminUnlocked(false);
  }, []);

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && showRegisterModal) {
        handleCloseModal();
      }
    };

    if (showRegisterModal) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [showRegisterModal, handleCloseModal]);

  return (
    <div className="home-container">
      <div className="header-section">
        <h1 className="main-heading">Find your perfect place to stay</h1>
        <button 
          className="about-btn" 
          onClick={handleAboutClick} 
          disabled={isLoading}
          type="button"
        >
          About
        </button>
      </div>

      <div className="login-section">
        <div className="login-container">
          <div className="brand-section">
            <h2 className="brand-title">MAY SPACE</h2>
            <h3 className="login-title">LOGIN</h3>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="input-group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={handleInputChange(setUsername)}
                required
                className="form-input"
                disabled={isLoading}
                autoComplete="username"
                autoFocus
                aria-label="Username"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={handleInputChange(setPassword)}
                required
                className="form-input"
                disabled={isLoading}
                autoComplete="current-password"
                aria-label="Password"
              />
            </div>

            <div className="action-links">
              <Link 
                to="/forgot-password" 
                className="action-link"
                onClick={(e) => isLoading && e.preventDefault()}
              >
                Forgot Password?
              </Link>
              <button 
                type="button" 
                onClick={handleGuestLogin} 
                className="action-link" 
                disabled={isLoading}
              >
                Guest
              </button>
              <button 
                type="button" 
                onClick={handleOpenRegisterModal} 
                className="action-link" 
                disabled={isLoading}
              >
                Register
              </button>
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={isLoading}
              aria-label={isLoading ? "Logging in" : "Login"}
            >
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>
        </div>
      </div>

      {showRegisterModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="homeClose-btn" 
              onClick={handleCloseModal}
              aria-label="Close modal"
              type="button"
            >
              ×
            </button>
            <h3>Create Account</h3>
            <p>Register as a user to find rental units</p>
            <div className="register-options">
              <div className="register-option single-option">
                <div className="option-icon">👤</div>
                <h4>Register as User</h4>
                <p>Find and book rental units</p>
                <button 
                  onClick={handleRegisterAsUser} 
                  className="option-btn"
                  type="button"
                  disabled={isLoading}
                >
                  Create User Account
                </button>
              </div>
              
              {adminUnlocked && (
                <div className="register-option admin-option">
                  <div className="option-icon">⚙️</div>
                  <h4>Register as Admin</h4>
                  <p>Manage units and system</p>
                  <button 
                    onClick={handleRegisterAsAdmin} 
                    className="option-btn admin-btn"
                    type="button"
                    disabled={isLoading}
                  >
                    Create Admin Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;