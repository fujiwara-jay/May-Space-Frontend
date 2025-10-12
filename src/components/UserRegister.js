import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../cssfiles/UserRegister.css";

function UserRegister() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !email || !contactNumber || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(contactNumber)) {
      setError("Please enter a valid contact number (10-15 digits)");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch("https://may-space-backend.onrender.com/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, contactNumber, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setError("");

        setTimeout(() => {
          setShowSuccess(false);
          setUsername("");
          setEmail("");
          setContactNumber("");
          setPassword("");
          setConfirmPassword("");
        }, 2000);
      } else {
        setError(data.message || "User registration failed");
      }
    } catch (err) {
      console.error("User registration error:", err);
      setError("Failed to connect to the server");
    }
  };

  return (
    <div className="renter-register-container">
      <div className="register-box">
        <h2>Create User Account</h2>
        {error && <div className="error-message">{error}</div>}
        {showSuccess && (
          <div className="success-popup">User registration successful!</div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="Username"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
          />
          <input
            type="text"
            placeholder="Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            aria-label="Contact Number"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Password"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-label="Confirm Password"
          />

          <div className="register-links">
            <span>Already have an account? </span>
            <Link to="/home">Login</Link>
          </div>
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default UserRegister;
