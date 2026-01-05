import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../cssfiles/UserRegister.css";

function UserRegister() {
  const [name, setName] = useState("");
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
  const [showPolicy, setShowPolicy] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
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

  const validateForm = () => {
    setError("");

    if (!name || !username || !email || !contactNumber || !password || !confirmPassword) {
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

    if (!agreedToPolicy) {
      setError("You must agree to the registration policies");
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
      const response = await fetch("https://may-space-backend.onrender.com/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          username, 
          email, 
          contactNumber, 
          password 
        }),
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
        setError(data.message || "User registration failed");
      }
    } catch (err) {
      console.error("User registration error:", err);
      setError("Failed to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxClick = () => {
    setShowPolicy(true);
  };

  const handleAgreeToPolicy = () => {
    setAgreedToPolicy(true);
    setShowPolicy(false);
  };

  const handleDisagreeToPolicy = () => {
    setAgreedToPolicy(false);
    setShowPolicy(false);
    setError("You must agree to the policies to register.");
  };

  const handleClosePolicy = () => {
    setShowPolicy(false);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setContactNumber(value);
  };

  const handleBackToLogin = () => {
    navigate("/home");
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
    <div className="renter-register-container">
      {showPolicy && (
        <div className="policy-modal-overlay">
          <div className="policy-modal">
            <div className="policy-modal-header">
              <h3>May Space Registration Policies</h3>
              <button 
                className="policy-close-btn"
                onClick={handleClosePolicy}
                aria-label="Close policy modal"
              >
                ×
              </button>
            </div>
            
            <div className="policy-modal-content">
              <div className="policy-section">
                <h4>REGISTER SIDE POLICY</h4>
                <div className="policy-subsection">
                  <h5>1. Registration Requirement</h5>
                  <p>• Users must create an account to access full features of May Space.</p>
                  <p>• Registration requires accurate and complete information.</p>
                </div>
                
                <div className="policy-subsection">
                  <h5>2. Account Information</h5>
                  <p>• Users must provide a valid name, email address, and contact number.</p>
                  <p>• Users are responsible for keeping their account details updated.</p>
                </div>
                
                <div className="policy-subsection">
                  <h5>3. Account Security</h5>
                  <p>• Users are responsible for maintaining the confidentiality of their username and password.</p>
                  <p>• Any activity performed using the registered account is the responsibility of the account holder.</p>
                </div>
                
                <div className="policy-subsection">
                  <h5>4. Consent and Agreement</h5>
                  <p>• By clicking the "Agree" button, users confirm that they have read and agreed to the Terms & Conditions and Privacy Policy.</p>
                  <p>• Registration signifies consent to the collection and processing of personal data in accordance with the Data Privacy Act of 2012 (RA 10173).</p>
                </div>
                
                <div className="policy-subsection">
                  <h5>5. Account Suspension</h5>
                  <p>• May Space reserves the right to suspend or terminate accounts with false, misleading, or suspicious information.</p>
                </div>
              </div>
              
              <div className="policy-section">
                <h4>SYSTEM POLICY</h4>
                <div className="policy-subsection">
                  <h5>1. System Usage</h5>
                  <p>• The May Space system must be used only for lawful rental-related purposes.</p>
                  <p>• Users must not misuse system features or attempt to disrupt platform operations.</p>
                </div>
                
                <div className="policy-subsection">
                  <h5>2. Data Protection and Security</h5>
                  <p>• User data is protected using appropriate security measures.</p>
                  <p>• Unauthorized access, data scraping, or system tampering is strictly prohibited.</p>
                </div>
                
                <div className="policy-subsection">
                  <h5>3. System Availability</h5>
                  <p>• May Space aims to provide reliable system access but does not guarantee uninterrupted availability.</p>
                  <p>• Maintenance or technical issues may cause temporary downtime.</p>
                </div>
                
                <div className="policy-subsection">
                  <h5>4. Monitoring and Logs</h5>
                  <p>• System activities may be monitored and logged to ensure security and performance.</p>
                  <p>• Logs are handled in compliance with the Data Privacy Act of 2012 (RA 10173).</p>
                </div>
                
                <div className="policy-subsection">
                  <h5>5. Policy Violations</h5>
                  <p>• Violations of system policies may result in warnings, account suspension, or permanent termination.</p>
                </div>
              </div>
              
              <div className="policy-notice">
                <p><strong>By registering and using the May Space system, users acknowledge and agree to comply with these policies.</strong></p>
              </div>
              
              <div className={`policy-agreement-checkbox-modal ${agreedToPolicy ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  id="policy-agreement"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                />
                <label htmlFor="policy-agreement">
                  I have read, understood, and agree to all the policies stated above
                </label>
              </div>
            </div>
            
            <div className="policy-modal-footer">
              <button 
                className="policy-btn disagree-btn"
                onClick={handleDisagreeToPolicy}
                disabled={isLoading}
              >
                Disagree
              </button>
              <button 
                className="policy-btn agree-btn"
                onClick={handleAgreeToPolicy}
                disabled={!agreedToPolicy || isLoading}
              >
                Agree
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="register-box">
        <h2>Create User Account</h2>
        {error && <div className="error-message">{error}</div>}
        {showSuccess && (
          <div className="success-popup">User registration successful! Redirecting to login...</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Full Name"
              maxLength={50}
              required
              disabled={isLoading || showSuccess}
            />
            <span className="required-indicator">*</span>
          </div>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="Username"
              maxLength={30}
              required
              disabled={isLoading || showSuccess}
            />
            <span className="required-indicator">*</span>
          </div>
          
          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
              maxLength={100}
              required
              disabled={isLoading || showSuccess}
            />
            <span className="required-indicator">*</span>
          </div>
          
          <div className="input-group">
            <input
              type="text"
              placeholder="Contact Number (e.g., 09123456789)"
              value={contactNumber}
              onChange={handlePhoneChange}
              aria-label="Contact Number"
              maxLength={15}
              required
              disabled={isLoading || showSuccess}
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
                  aria-label="Password"
                  maxLength={30}
                  required
                  disabled={isLoading || showSuccess}
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
                  aria-label="Confirm Password"
                  maxLength={30}
                  required
                  disabled={isLoading || showSuccess}
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

          <div className="policy-agreement-container">
            <div 
              className={`policy-checkbox-wrapper ${agreedToPolicy ? 'checked' : ''}`} 
              onClick={() => !isLoading && !showSuccess && handleCheckboxClick()}
            >
              <input
                type="checkbox"
                id="mini-policy-agreement"
                checked={agreedToPolicy}
                onChange={() => {}}
                readOnly
              />
              <label htmlFor="mini-policy-agreement" className="policy-checkbox-label">
                I agree to the <span className="policy-link-text">Registration Policies</span>
                <span className="required-indicator">*</span>
              </label>
              <span className="checkmark-indicator">✓</span>
            </div>
          </div>

          <div className="register-links">
            <span>Already have an account? </span>
            <Link to="/home" onClick={handleBackToLogin}>Login</Link>
          </div>
          <button 
            type="submit" 
            disabled={isLoading || showSuccess}
            className={isLoading ? "loading" : ""}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserRegister;