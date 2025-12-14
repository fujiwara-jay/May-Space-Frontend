import React, { useState } from "react";
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
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Password must contain at least one special character";
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

  const validateForm = () => {
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreedToPolicy) {
      setShowPolicy(true);
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch("https://may-space-backend.onrender.com/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, contactNumber, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setError("");
        setPasswordStrength("");

        setTimeout(() => {
          setShowSuccess(false);
          setUsername("");
          setName("");
          setEmail("");
          setContactNumber("");
          setPassword("");
          setConfirmPassword("");
          setShowPassword(false);
          setShowConfirmPassword(false);
          setAgreedToPolicy(false);
        }, 2000);
      } else {
        setError(data.message || "User registration failed");
      }
    } catch (err) {
      console.error("User registration error:", err);
      setError("Failed to connect to the server");
    }
  };

  const handleAgreeToPolicy = () => {
    setAgreedToPolicy(true);
    setShowPolicy(false);
    
    document.querySelector("form").requestSubmit();
  };

  const handleDisagreeToPolicy = () => {
    setShowPolicy(false);
    setError("You must agree to the policies to register.");
  };

  return (
    <div className="renter-register-container">
      {/* Policy Modal */}
      {showPolicy && (
        <div className="policy-modal-overlay">
          <div className="policy-modal">
            <div className="policy-modal-header">
              <h3>May Space Registration Policies</h3>
              <button 
                className="policy-close-btn"
                onClick={() => setShowPolicy(false)}
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
                  <p>• By clicking the "Agree & Register" button, users confirm that they have read and agreed to the Terms & Conditions and Privacy Policy.</p>
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
              
              <div className="policy-agreement-checkbox">
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
              >
                Disagree
              </button>
              <button 
                className="policy-btn agree-btn"
                onClick={handleAgreeToPolicy}
                disabled={!agreedToPolicy}
              >
                Agree & Register
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="register-box">
        <h2>Create User Account</h2>
        {error && <div className="error-message">{error}</div>}
        {showSuccess && (
          <div className="success-popup">User registration successful!</div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Full Name"
            maxLength={50}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="Username"
            maxLength={30}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
            maxLength={100}
          />
          <input
            type="text"
            placeholder="Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            aria-label="Contact Number"
            maxLength={15}
          />
          
          <div className="password-input-container">
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password (10-30 characters with uppercase, lowercase & numbers)"
                value={password}
                onChange={handlePasswordChange}
                aria-label="Password"
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
                aria-label="Confirm Password"
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

          <div className="policy-agreement-mini">
            <input
              type="checkbox"
              id="mini-policy-agreement"
              checked={agreedToPolicy}
              onChange={(e) => setAgreedToPolicy(e.target.checked)}
            />
            <label htmlFor="mini-policy-agreement">
              I agree to the <span className="policy-link" onClick={() => setShowPolicy(true)}>Registration Policies</span>
            </label>
          </div>

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