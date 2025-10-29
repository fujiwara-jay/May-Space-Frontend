import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../cssfiles/AdminRegister.css";

function AdminRegister() {
  const [showPinPrompt, setShowPinPrompt] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const SECURITY_PIN = "00000000";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleBack = () => {
    if (showPinPrompt) {
      navigate("/home");
    } else {
      setShowPinPrompt(true);
      setPinInput("");
      setPinError("");
    }
  };

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
      const response = await fetch("https://may-space-backend.onrender.com/admin/register", {
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
        setError(data.message || "Admin registration failed");
      }
    } catch (err) {
      console.error("Admin registration error:", err);
      setError("Failed to connect to the server");
    }
  };

  return (
    <div className="admin-register-container">
      <div className="register-box">
        {showPinPrompt ? (
          <>
            <h2 style={{ color: '#f7e7b6', fontWeight: 900, letterSpacing: '0.35em', fontSize: '1.6rem', marginBottom: '1.5rem' }}>Admin Security Pin</h2>
            <div style={{ background: 'rgba(255,0,0,0.13)', color: '#ff6666', fontWeight: 'bold', borderRadius: '6px', padding: '0.7rem', marginBottom: '1rem', textAlign: 'center', fontSize: '15px' }}>
              <span style={{ fontSize: '16px', textTransform: 'uppercase' }}>Security Notice</span><br />
              <span>
                The creation of admin accounts is strictly controlled and protected by a security pin.<br /><br />
                Only authorized personnel should proceed. Unauthorized attempts to create an admin account are prohibited and may be logged for review.
              </span>
            </div>
            <div style={{ marginBottom: 18, fontSize: '15px', color: '#e0c16d', textAlign: 'center' }}>
              Please enter the security pin to proceed.
            </div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter Security Pin"
              value={pinInput}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setPinInput(val);
              }}
              className="admin-pin-input"
              maxLength={16}
            />
            {pinError && <div className="error-message">{pinError}</div>}
            <button
              type="button"
              className="admin-pin-btn"
              onClick={() => {
                if (pinInput === SECURITY_PIN) {
                  setShowPinPrompt(false);
                  setPinError("");
                } else {
                  setPinError("Incorrect security pin.");
                }
              }}
            >
              Continue
            </button>
            <button
              type="button"
              className="securityBack-btn"
              onClick={handleBack}
            >
              Back
            </button>
          </>
        ) : (
          <>
            <h2>Create Admin Account</h2>
            {error && <div className="error-message">{error}</div>}
            {showSuccess && (
              <div className="success-popup">Admin registration successful!</div>
            )}
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Admin Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-label="Admin Username"
              />
              <input
                type="email"
                placeholder="Admin Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Admin Email"
              />
              <input
                type="text"
                placeholder="Contact Number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                aria-label="Admin Contact Number"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Admin Password"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-label="Confirm Admin Password"
              />

              <div className="register-links">
                <span>Already have an account? </span>
                <Link to="/home">Login</Link>
              </div>
              <button type="submit">Register</button>
              <button
                type="button"
                className="back-btn"
                onClick={handleBack}
              >
                Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminRegister;