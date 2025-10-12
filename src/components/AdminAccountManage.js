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
    <div className="dashboard-container">
      <button className="back-button" onClick={handleBack}>
        ⬅ Back
      </button>

      <div className="header">
        <h1 className="dashboard-title">Account Manage</h1>
      </div>

      <div style={{ color: "#fff", marginTop: 24 }}>
        {loading && <div>Loading users...</div>}
        {error && <div style={{ color: "salmon" }}>{error}</div>}
        {actionMessage && <div style={{ color: "lightgreen" }}>{actionMessage}</div>}
        {!loading && users.length === 0 && <div>No users found.</div>}

        <div className="unit-grid">
          {users.map((user) => (
            <div
              key={user.id}
              className="unit-card"
              style={{
                background: "#2c363f",
                color: "#f7e7b6",
                marginBottom: 18,
                borderRadius: 10,
                padding: 18,
              }}
            >
              <div><strong>Username:</strong> {user.username}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Contact:</strong> {user.contact_number}</div>
              <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>

              <button
                style={{
                  marginTop: 10,
                  background: "#e57373",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "7px 18px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => openDeleteModal(user.id)}
              >
                Delete User
              </button>
            </div>
          ))}
        </div>
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
                <p>Do you confirm to delete this account?</p>
                <div className="admin-modal-actions">
                  <button className="admin-modal-btn confirm" onClick={handleDeleteConfirm}>
                    Yes, Continue
                  </button>
                  <button className="admin-modal-btn cancel" onClick={closeDeleteModal}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {deleteStep === 2 && (
              <>
                <h2>Warning</h2>
                <p>This will be deleted in the database and cannot be recovered. Proceed?</p>
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
