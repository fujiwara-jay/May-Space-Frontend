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
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    if (password.length === 0) return "";
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const lengthValid = password.length >= 10 && password.length <= 30;
    
    const requirementsMet = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      lengthValid
    ].filter(Boolean).length;
    
    if (requirementsMet >= 4) return "strong";
    if (requirementsMet >= 3) return "medium";
    return "weak";
  };

  const validatePassword = (password) => {
    if (password.length < 10 || password.length > 30) {
      return "Password must be between 10-30 characters";
    }
    
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    
    return "";
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
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
        setPasswordStrength("");

        setTimeout(() => {
          setShowSuccess(false);
          setUsername("");
          setEmail("");
          setContactNumber("");
          setPassword("");
          setConfirmPassword("");
          setShowPassword(false);
          setShowConfirmPassword(false);
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
            <h2 className="security-title">Admin Security Pin</h2>
            <div className="security-notice">
              <span className="security-notice-title">Security Notice</span><br />
              <span>
                The creation of admin accounts is strictly controlled and protected by a security pin.<br /><br />
                Only authorized personnel should proceed. Unauthorized attempts to create an admin account are prohibited and may be logged for review.
              </span>
            </div>
            <div className="security-instruction">
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
              
              <div className="password-input-container">
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (10-30 characters with uppercase, lowercase & numbers)"
                    value={password}
                    onChange={handlePasswordChange}
                    aria-label="Admin Password"
                    maxLength={30}
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {password && (
                  <div className={`password-strength ${passwordStrength}`}>
                    <span>Password Strength: </span>
                    <span className="strength-text">
                      {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </span>
                    <div className="strength-bar">
                      <div className={`strength-fill ${passwordStrength}`}></div>
                    </div>
                  </div>
                )}
                <div className="password-requirements">
                  <small>Password must be 10-30 characters with at least:</small>
                  <small>• One uppercase letter (A-Z)</small>
                  <small>• One lowercase letter (a-z)</small>
                  <small>• One number (0-9)</small>
                  <small>• One special character (!@#$%^&*)</small>
                </div>
              </div>
              
              <div className="password-input-container">
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-label="Confirm Admin Password"
                    maxLength={30}
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={toggleConfirmPasswordVisibility}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

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