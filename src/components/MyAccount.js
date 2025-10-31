import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/MyAccount.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://may-space-backend.onrender.com";

const MyAccount = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    contactNumber: "",
    userType: "",
    createdAt: ""
  });
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const userId = localStorage.getItem("userId");
  const userType = localStorage.getItem("userType");
  const isGuest = !userId || userId === "guest";

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (isGuest) {
      navigate("/home");
      return;
    }
    
    fetchUserData();
    
    return () => {
      mountedRef.current = false;
    };
  }, [isGuest, navigate]);

  const fetchUserData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (mountedRef.current) {
        const user = data.user || data;
        setUserData({
          name: user.name || "",
          username: user.username || "",
          email: user.email || "",
          contactNumber: user.contactNumber || user.contact_number || "",
          userType: user.userType || user.user_type || "",
          createdAt: user.createdAt || user.created_at || ""
        });
        setEditedData({
          name: user.name || "",
          email: user.email || "",
          contactNumber: user.contactNumber || user.contact_number || ""
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("Error fetching user data:", err);
        setError(`Failed to load user data: ${err.message}`);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    if (!editedData.name?.trim()) {
      setError("Name is required");
      setSaving(false);
      return;
    }

    if (!editedData.email?.trim()) {
      setError("Email is required");
      setSaving(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedData.email)) {
      setError("Please enter a valid email address");
      setSaving(false);
      return;
    }

    if (!editedData.contactNumber?.trim()) {
      setError("Contact number is required");
      setSaving(false);
      return;
    }

    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    const cleanPhone = editedData.contactNumber.replace(/[-\s()]/g, '');
    if (!/^[0-9]{10,15}$/.test(cleanPhone)) {
      setError("Please enter a valid contact number (10-15 digits)");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId
        },
        body: JSON.stringify({
          name: editedData.name.trim(),
          email: editedData.email.trim(),
          contactNumber: editedData.contactNumber.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (mountedRef.current) {
        const updatedUser = data.user || data;
        setUserData(prev => ({
          ...prev,
          name: updatedUser.name || editedData.name,
          email: updatedUser.email || editedData.email,
          contactNumber: updatedUser.contactNumber || editedData.contactNumber
        }));
        setSuccess("Profile updated successfully!");
        setEditMode(false);
        
        setTimeout(() => {
          if (mountedRef.current) setSuccess("");
        }, 3000);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("Error updating profile:", err);
        setError(`Failed to update profile: ${err.message}`);
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    setError("");
    setSuccess("");

    if (!passwordData.currentPassword) {
      setError("Current password is required");
      setChangingPassword(false);
      return;
    }

    if (!passwordData.newPassword) {
      setError("New password is required");
      setChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      setChangingPassword(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      setChangingPassword(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (mountedRef.current) {
        setSuccess("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        
        setTimeout(() => {
          if (mountedRef.current) setSuccess("");
        }, 3000);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("Error changing password:", err);
        setError(`Failed to change password: ${err.message}`);
      }
    } finally {
      if (mountedRef.current) setChangingPassword(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      name: userData.name,
      email: userData.email,
      contactNumber: userData.contactNumber
    });
    setEditMode(false);
    setError("");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userType");
    navigate("/home");
  };

  const handlePostUnitClick = () => {
    setSidebarOpen(false);
    navigate("/post-unit");
  };

  const handleMessageInquiriesClick = () => {
    setSidebarOpen(false);
    navigate("/message-inquiries");
  };

  const handleBookingsClick = () => {
    setSidebarOpen(false);
    navigate("/bookings");
  };

  const handleUnitFinderClick = () => {
    setSidebarOpen(false);
    navigate("/unitfinder");
  };

  const handleAboutClick = () => {
    setSidebarOpen(false);
    navigate("/about");
  };

  const handleStudentProjectsClick = () => {
    setSidebarOpen(false);
    navigate("/studentProjects");
  };

  const handleProjectToolsClick = () => {
    setSidebarOpen(false);
    navigate("/tools");
  };

  if (isGuest) {
    return null;
  }

  if (loading) {
    return (
      <div className="my-account-container">
        <div className="loading-message">Loading your account...</div>
      </div>
    );
  }

  return (
    <div className="my-account-container">
      <button className="menu-toggle-btn" onClick={toggleSidebar}>
        ☰ Menu
      </button>

      <div className={`sidebar-menu ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>May Space</h3>
          <button className="sidebar-close-btn" onClick={toggleSidebar}>
            ✕
          </button>
        </div>
        
        <div className="sidebar-content">
          <button className="sidebar-btn active">
            👤 Dashboard Account
          </button>
          
          <button 
            className="sidebar-btn"
            onClick={handleUnitFinderClick}
          >
            🔍 Browse Units
          </button>
          <button 
            className="sidebar-btn"
            onClick={handlePostUnitClick}
          >
            ➕ Post New Unit
          </button>
          <button 
            className="sidebar-btn"
            onClick={handleMessageInquiriesClick}
          >
            💬 Message & Inquiries
          </button>
          <button 
            className="sidebar-btn"
            onClick={handleBookingsClick}
          >
            📅 View Bookings
          </button>
          
          <div className="sidebar-divider"></div>
          
          <button 
            className="sidebar-btn"
            onClick={handleAboutClick}
          >
            ℹ️ About
          </button>
          <button 
            className="sidebar-btn"
            onClick={handleStudentProjectsClick}
          >
            🎓 Student Projects
          </button>
          <button 
            className="sidebar-btn"
            onClick={handleProjectToolsClick}
          >
            🛠️ Project Tools
          </button>
          
          <div className="sidebar-footer">
            <button 
              className="sidebar-btn logout-btn"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <div className="account-content">
        <div className="account-header">
          <h1>My Account</h1>
          <p>Manage your profile information and account settings</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="account-tabs">
          <button 
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile Information
          </button>
          <button 
            className={`tab-btn ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            🔒 Change Password
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="profile-card">
            <div className="profile-header">
              <h2>Profile Information</h2>
              {!editMode ? (
                <button 
                  className="edit-btn"
                  onClick={() => setEditMode(true)}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button 
                    className="save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "💾 Save"}
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="profile-details">
              <div className="detail-row">
                <label>User Type:</label>
                <div className="user-type-badge">
                  {userData.userType || userType || "User"}
                </div>
              </div>

              <div className="detail-row">
                <label>Full Name:</label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={editedData.name || ""}
                    onChange={handleInputChange}
                    className="edit-input"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <span>{userData.name || "Not provided"}</span>
                )}
              </div>

              <div className="detail-row">
                <label>Username:</label>
                <span className="username-display">{userData.username || "N/A"}</span>
              </div>

              <div className="detail-row">
                <label>Email:</label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={editedData.email || ""}
                    onChange={handleInputChange}
                    className="edit-input"
                    placeholder="Enter your email"
                  />
                ) : (
                  <span>{userData.email || "Not provided"}</span>
                )}
              </div>

              <div className="detail-row">
                <label>Contact Number:</label>
                {editMode ? (
                  <input
                    type="text"
                    name="contactNumber"
                    value={editedData.contactNumber || ""}
                    onChange={handleInputChange}
                    className="edit-input"
                    placeholder="Enter your contact number (e.g., 09123456789)"
                  />
                ) : (
                  <span>{userData.contactNumber || "Not provided"}</span>
                )}
              </div>

              <div className="detail-row">
                <label>User ID:</label>
                <span className="user-id">{userId}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "password" && (
          <div className="password-card">
            <div className="password-header">
              <h2>Change Password</h2>
            </div>

            <div className="password-form">
              <div className="form-group">
                <label>Current Password:</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="password-input"
                  placeholder="Enter your current password"
                />
              </div>

              <div className="form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="password-input"
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="password-input"
                  placeholder="Confirm your new password"
                />
              </div>

              <div className="password-actions">
                <button 
                  className="change-password-btn"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? "Changing..." : "🔒 Change Password"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="account-stats">
          <div className="stat-card">
            <h3>Account Created</h3>
            <p>{userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "N/A"}</p>
          </div>
          <div className="stat-card">
            <h3>Status</h3>
            <p className="status-active">Active</p>
          </div>
        </div>

        <div className="security-note">
          <h4>🔒 Security Note</h4>
          <p>For security reasons, username and user type cannot be changed. 
          Contact support if you need to update these details.</p>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;