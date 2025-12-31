import React, { useState, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (password && confirmPassword) {
      if (password === confirmPassword) {
        setPasswordMatch(true);
      } else {
        setPasswordMatch(false);
      }
    } else {
      setPasswordMatch(null);
    }
  }, [password, confirmPassword]);

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
    const errors = [];
    
    if (password.length < 10 || password.length > 30) {
      errors.push("Password must be between 10-30 characters");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    setPasswordErrors(errors);
    return errors.length === 0 ? "" : errors[0];
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
    validatePassword(newPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (password && value) {
      if (password === value) {
        setPasswordMatch(true);
      } else {
        setPasswordMatch(false);
      }
    }
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

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setContactNumber(value);
  };

  const validateForm = () => {
    setError("");

    if (!username || !email || !contactNumber || !password || !confirmPassword) {
      setError("All fields are required");
      return false;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(contactNumber)) {
      setError("Please enter a valid contact number (10-15 digits)");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

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
        setPasswordMatch(null);
        setPasswordErrors([]);

        setTimeout(() => {
          navigate("/home");
        }, 2000);
      } else {
        setError(data.message || "Admin registration failed");
      }
    } catch (err) {
      console.error("Admin registration error:", err);
      setError("Failed to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordMatchText = () => {
    if (passwordMatch === null) return "";
    if (passwordMatch === true) return "Passwords match!";
    if (passwordMatch === false) return "Passwords do not match";
    return "";
  };

  const getPasswordMatchClass = () => {
    if (passwordMatch === null) return "";
    if (passwordMatch === true) return "match";
    if (passwordMatch === false) return "mismatch";
    return "";
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
              disabled={isLoading}
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
              disabled={isLoading}
            >
              Continue
            </button>
            <button
              type="button"
              className="securityBack-btn"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </button>
          </>
        ) : (
          <>
            <h2>Create Admin Account</h2>
            {error && <div className="error-message">{error}</div>}
            {showSuccess && (
              <div className="success-popup">Admin registration successful! Redirecting to login...</div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Admin Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-label="Admin Username"
                  disabled={isLoading || showSuccess}
                  required
                />
                <span className="required-indicator">*</span>
              </div>
              
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Admin Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Admin Email"
                  disabled={isLoading || showSuccess}
                  required
                />
                <span className="required-indicator">*</span>
              </div>
              
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Contact Number (e.g., 09123456789)"
                  value={contactNumber}
                  onChange={handlePhoneChange}
                  aria-label="Admin Contact Number"
                  maxLength={15}
                  disabled={isLoading || showSuccess}
                  required
                />
                <span className="required-indicator">*</span>
              </div>
              
              <div className="input-group">
                <div className="password-input-container">
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (10-30 characters with uppercase, lowercase & numbers)"
                      value={password}
                      onChange={handlePasswordChange}
                      aria-label="Admin Password"
                      maxLength={30}
                      disabled={isLoading || showSuccess}
                      required
                      className={passwordErrors.length > 0 ? "password-error" : ""}
                    />
                    <button 
                      type="button"
                      className="toggle-password"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={isLoading || showSuccess}
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
                  
                  {passwordErrors.length > 0 && (
                    <div className="password-errors">
                      {passwordErrors.map((errorMsg, index) => (
                        <div key={index} className="password-error-item">
                          <span className="error-icon">✗</span>
                          <span>{errorMsg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="password-requirements">
                    <small>Password must be 10-30 characters with at least:</small>
                    <small className={password.length >= 10 && password.length <= 30 ? "requirement-met" : ""}>
                      • 10-30 characters
                    </small>
                    <small className={/[A-Z]/.test(password) ? "requirement-met" : ""}>
                      • One uppercase letter (A-Z)
                    </small>
                    <small className={/[a-z]/.test(password) ? "requirement-met" : ""}>
                      • One lowercase letter (a-z)
                    </small>
                    <small className={/\d/.test(password) ? "requirement-met" : ""}>
                      • One number (0-9)
                    </small>
                    <small className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "requirement-met" : ""}>
                      • One special character (!@#$%^&*)
                    </small>
                  </div>
                </div>
                <span className="required-indicator">*</span>
              </div>
              
              <div className="input-group">
                <div className="password-input-container">
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      aria-label="Confirm Admin Password"
                      maxLength={30}
                      disabled={isLoading || showSuccess}
                      required
                      className={passwordMatch === false ? "password-mismatch" : ""}
                    />
                    <button 
                      type="button"
                      className="toggle-password"
                      onClick={toggleConfirmPasswordVisibility}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      disabled={isLoading || showSuccess}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  
                  {passwordMatch !== null && (
                    <div className={`password-match-indicator ${getPasswordMatchClass()}`}>
                      <span className="match-icon">
                        {passwordMatch ? "✓" : "✗"}
                      </span>
                      <span className="match-text">
                        {getPasswordMatchText()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="required-indicator">*</span>
              </div>

              <div className="required-fields-note">
                <small><span className="required-indicator">*</span> Required fields</small>
              </div>

              <div className="register-links">
                <span>Already have an account? </span>
                <Link to="/home" onClick={() => navigate("/home")}>Login</Link>
              </div>
              
              <button 
                type="submit" 
                disabled={isLoading || showSuccess}
                className={isLoading ? "loading" : ""}
              >
                {isLoading ? "Registering..." : "Register"}
              </button>
              
              <button
                type="button"
                className="back-btn"
                onClick={handleBack}
                disabled={isLoading}
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