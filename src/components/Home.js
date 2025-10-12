import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../cssfiles/Home.css";

function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("renter");
  const [error, setError] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    try {
      const endpoint = userType === "admin"
        ? "https://may-space-backend.onrender.com/admin/login"
        : "https://may-space-backend.onrender.com/user/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = userType === "admin" ? data.admin : data.user;
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("userType", userType);

        if (userType === "admin") {
          navigate("/admin-dashboard", {
            state: { userId: userData.id, userType: "admin" },
          });
        } else {
          navigate("/dashboard", {
            state: { userId: userData.id, userType: "user" },
          });
        }
      } else {
        setError(data.message || `Login failed. Make sure you selected the correct account type.`);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect to the server");
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem("userId", "guest");
    localStorage.setItem("userType", "guest");
    navigate("/unitfinder");
  };

  const handleAboutClick = () => {
    navigate("/about");
  };


  const handleRegisterAsUser = () => {
    setUserType("user");
    setShowRegisterModal(false);
    navigate("/register/user");
  };

  const handleRegisterAsAdmin = () => {
    setShowRegisterModal(false);
    navigate("/register/admin");
  };

  return (
    <div className="home-container">
      <header className="header">
        <h1 className="title">May Space: A Web-Based Rental Unit Space Finder</h1>
        <button className="about-button" onClick={handleAboutClick}>
          About
        </button>
      </header>

      <section className="login-box" aria-label="Login form">
        <h1 className="login-title">MAY SPACE</h1>
        <h2 className="login-subtitle">LOGIN</h2>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            aria-label="Username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Password"
          />

          <div className="user-type-selector">
            <label
              className={`user-type-option ${
                userType === "user" ? "active" : ""
              }`}
            >
              <input
                type="radio"
                value="user"
                checked={userType === "user"}
                onChange={(e) => setUserType(e.target.value)}
                className="user-type-input"
              />
              <span className="user-type-label">User</span>
            </label>
            <label
              className={`user-type-option ${
                userType === "admin" ? "active" : ""
              }`}
            >
              <input
                type="radio"
                value="admin"
                checked={userType === "admin"}
                onChange={(e) => setUserType(e.target.value)}
                className="user-type-input"
              />
              <span className="user-type-label">Admin</span>
            </label>
          </div>

          <div className="login-links">
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
            <button type="button" onClick={handleGuestLogin} className="guest-login">
              Guest
            </button>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="register-button"
            >
              Register
            </button>
          </div>

          <button type="submit" className="login-button">
            LOGIN
          </button>
        </form>
      </section>

      {showRegisterModal && (
        <div
          className="register-modal-overlay"
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="register-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowRegisterModal(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-header">
              <h2>Create Account</h2>
              <p>Choose your account type</p>
            </div>

            <div className="register-options">
              <div className="register-option-card">
                <div className="option-icon">👤</div>
                <h3>Register as User</h3>
                <p>Find and book rental units</p>
                <button
                  className="UserRegister"
                  onClick={handleRegisterAsUser}
                >
                  Create User Account →
                </button>
              </div>

              <div className="register-option-card">
                <div className="option-icon">⚙️</div>
                <h3>Register as Admin</h3>
                <p>Manage units and system</p>
                <button
                  className="AdminRegister"
                  onClick={handleRegisterAsAdmin}
                >
                  Create Admin Account →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
