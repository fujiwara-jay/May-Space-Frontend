import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/AdminAccountManage.css";

function AdminAccountManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [revealUserId, setRevealUserId] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [pinError, setPinError] = useState("");

  const navigate = useNavigate();
  const ADMIN_PIN = "000000";

  const handleBack = () => {
    navigate(-1);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://may-space-backend.onrender.com/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openDeleteModal = (userId) => {
    setDeleteId(userId);
    setDeleteStep(1);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
    setDeleteStep(1);
  };

  const handleDeleteConfirm = () => setDeleteStep(2);

  const handleDeleteFinal = async () => {
    if (!deleteId) return;
    setActionMessage("");
    try {
      const res = await fetch(`https://may-space-backend.onrender.com/admin/users/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete user");
      setActionMessage("User and all related data deleted successfully.");
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      closeDeleteModal();
    }
  };

  const maskSensitiveInfo = (text) => {
    if (!text) return "Not provided";
    const visibleChars = Math.min(2, text.length);
    return text.substring(0, visibleChars) + "*".repeat(text.length - visibleChars);
  };

  const handleRevealInfo = (userId) => {
    if (isRevealed && revealUserId === userId) {
      setIsRevealed(false);
      setRevealUserId(null);
    } else {
      setRevealUserId(userId);
      setShowPinModal(true);
      setPinInput("");
      setPinError("");
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setIsRevealed(true);
      setShowPinModal(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("Incorrect PIN code");
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPinInput("");
    setPinError("");
    setRevealUserId(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handlePinSubmit();
    }
  };

  return (
    <div className="admin-account-manage-container">
      <button className="back-button-manager" onClick={handleBack}>
        ⬅ Back
      </button>

      <div className="admin-account-header">
        <h1 className="admin-account-title">Account Management</h1>
        <p className="admin-subtitle">Sensitive information is hidden. Click "Reveal Info" to view details.</p>
      </div>

      <div className="admin-account-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        )}
        
        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchUsers}>
              Try Again
            </button>
          </div>
        )}
        
        {actionMessage && (
          <div className="action-message success">
            <div className="message-icon">✅</div>
            <p>{actionMessage}</p>
          </div>
        )}
        
        {!loading && users.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No Users Found</h3>
            <p>There are no users in the system yet.</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="users-grid">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <h3 className="user-name">{user.username}</h3>
                  <div className="user-badge">User</div>
                </div>
                
                <div className="user-info">
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className={`info-value ${isRevealed && revealUserId === user.id ? 'revealed' : ''}`}>
                      {isRevealed && revealUserId === user.id ? user.email : maskSensitiveInfo(user.email)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Contact:</span>
                    <span className={`info-value ${isRevealed && revealUserId === user.id ? 'revealed' : ''}`}>
                      {isRevealed && revealUserId === user.id 
                        ? (user.contact_number || "Not provided") 
                        : maskSensitiveInfo(user.contact_number)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Joined:</span>
                    <span className="info-value">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">User ID:</span>
                    <span className="info-value">{user.id}</span>
                  </div>
                </div>

                <div className="user-actions">
                  <button
                    className={`reveal-info-btn ${isRevealed && revealUserId === user.id ? 'active' : ''}`}
                    onClick={() => handleRevealInfo(user.id)}
                  >
                    {isRevealed && revealUserId === user.id ? 'Hide Info' : 'Reveal Info'}
                  </button>
                  <button
                    className="delete-user-btn"
                    onClick={() => openDeleteModal(user.id)}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="admin-modal-overlay" onClick={closeDeleteModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={closeDeleteModal}>
              &times;
            </button>

            {deleteStep === 1 && (
              <>
                <h2>Delete Account</h2>
                <p>Are you sure you want to delete this user account? This action cannot be undone.</p>
                <div className="admin-modal-actions">
                  <button className="admin-modal-btn confirm" onClick={handleDeleteConfirm}>
                    Continue to Delete
                  </button>
                  <button className="admin-modal-btn cancel" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {deleteStep === 2 && (
              <>
                <div className="modal-icon warning">⚠️</div>
                <h2>Final Warning</h2>
                <p>This will permanently delete the user account and all associated data from the database. This action cannot be recovered.</p>
                <div className="admin-modal-actions">
                  <button className="admin-modal-btn danger" onClick={handleDeleteFinal}>
                    Delete Permanently
                  </button>
                  <button className="admin-modal-btn cancel" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showPinModal && (
        <div className="admin-modal-overlay" onClick={closePinModal}>
          <div className="admin-modal pin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={closePinModal}>
              &times;
            </button>
            
            <div className="modal-icon lock">🔒</div>
            <h2>Admin Authentication Required</h2>
            <p>Enter admin PIN code to reveal sensitive information:</p>
            
            <div className="pin-input-wrapper">
              <input
                type="password"
                className="pin-input"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyPress={handleKeyPress}
                placeholder="000000"
                maxLength="6"
                autoFocus
              />
              {pinError && <div className="pin-error">{pinError}</div>}
            </div>
            
            <div className="admin-modal-actions">
              <button className="admin-modal-btn confirm" onClick={handlePinSubmit}>
                Verify PIN
              </button>
              <button className="admin-modal-btn cancel" onClick={closePinModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAccountManage;