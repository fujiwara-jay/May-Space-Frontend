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

  const navigate = useNavigate();

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

  return (
    <div className="admin-account-manage-container">
      <button className="back-button" onClick={handleBack}>
        ⬅ Back
      </button>

      <div className="admin-account-header">
        <h1 className="admin-account-title">Account Management</h1>
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
                    <span className="info-value">{user.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Contact:</span>
                    <span className="info-value">{user.contact_number || "Not provided"}</span>
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
                </div>

                <div className="user-actions">
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
    </div>
  );
}

export default AdminAccountManage;