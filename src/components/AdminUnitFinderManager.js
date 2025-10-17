  const safeParseImages = (imagesData) => {
    if (!imagesData) return [];
    if (Array.isArray(imagesData)) return imagesData;
    try {
      const parsed = JSON.parse(imagesData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/AdminUnitFinderManager.css";
import "../cssfiles/Dashboard.css";

function AdminUnitFinderManager() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [actionMessage, setActionMessage] = useState("");

  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://may-space-backend.onrender.com/admin/units");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch units");
      setUnits(data.units || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const openDeleteModal = (unitId) => {
    setDeleteId(unitId);
    setDeleteStep(1);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
    setDeleteStep(1);
  };

  const handleDeleteConfirm = () => {
    setDeleteStep(2);
  };

  const handleDeleteFinal = async () => {
    if (!deleteId) return;
    setActionMessage("");
    try {
      const res = await fetch(`https://may-space-backend.onrender.com/admin/units/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete unit");
      setActionMessage("Unit deleted successfully.");
      setUnits((prev) => prev.filter((u) => u.id !== deleteId));
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
        <h1 className="dashboard-title">Unit Finder Manager</h1>
      </div>

      <div style={{ color: "#fff", marginTop: 24 }}>
        {loading && <div>Loading units...</div>}
        {error && <div style={{ color: "salmon" }}>{error}</div>}
        {actionMessage && <div style={{ color: "lightgreen" }}>{actionMessage}</div>}
        {!loading && units.length === 0 && <div>No units found.</div>}

        <div className="unit-grid">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="unit-card"
              style={{
                background: "#2c363f",
                color: "#f7e7b6",
                marginBottom: 18,
                borderRadius: 10,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", gap: 18 }}>
                {safeParseImages(unit.images).length > 0 ? (
                  <img
                    src={`https://may-space-backend.onrender.com${safeParseImages(unit.images)[0]}`}
                    alt="unit"
                    style={{
                      width: 120,
                      height: 90,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 90,
                      background: "#444",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ccc",
                    }}
                  >
                    No Image
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div>
                    <strong>Unit:</strong> {unit.unit_number} ({unit.building_name})
                  </div>
                  <div>
                    <strong>Location:</strong> {unit.location}
                  </div>
                  <div>
                    <strong>Owner:</strong> {unit.owner_username} ({unit.owner_email})
                  </div>
                  <div>
                    <strong>Contact:</strong> {unit.contact_person} / {unit.phone_number}
                  </div>
                  <div>
                    <strong>Specs:</strong> {unit.specifications}
                  </div>
                  <div>
                    <strong>Special Features:</strong> {unit.special_features}
                  </div>
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
                    onClick={() => openDeleteModal(unit.id)}
                  >
                    Delete Unit
                  </button>
                </div>
              </div>
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
                <h2>Delete Unit</h2>
                <p>Do you confirm to delete this unit?</p>
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

export default AdminUnitFinderManager;
