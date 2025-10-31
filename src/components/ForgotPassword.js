import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("https://may-space-backend.onrender.com/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage("OTP sent! Please check your email (or use the OTP shown for testing).");
        setStep(2);
      } else {
        setError(data.message || "An error occurred. Please try again.");
      }
    } catch {
      setError("Failed to connect to the server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    setMessage("");
    setError("");

    if (!otp || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("https://may-space-backend.onrender.com/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/"), 1000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch {
      setError("Failed to connect to the server. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h2>Forgot Password?</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  placeholder="Enter your email address"
                />
              </div>
              <button type="submit" disabled={isLoading || !email.trim()}>
                {isLoading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="Enter the OTP"
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
              </div>
              <button
                type="button"
                className="reset-password-btn"
                onClick={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </>
          )}

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </form>
        <div className="back-to-login">
          <button
            type="button"
            className="back-login-btn"
            onClick={handleBackToLogin}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;