import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/AdminUnitFinderManager.css";

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

function AdminUnitFinderManager() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [actionMessage, setActionMessage] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const openImageModal = (unit, index = 0) => {
    setSelectedUnit(unit);
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedUnit(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    const images = safeParseImages(selectedUnit?.images);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = safeParseImages(selectedUnit?.images);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="unit-finder-container">
      <button className="back-button" onClick={handleBack}>
        ⬅ Back
      </button>

      <div className="unit-finder-header">
        <h1>Unit Finder Manager</h1>
      </div>

      <div style={{ color: "#fff", marginTop: 24, width: "100%", maxWidth: "1200px" }}>
        {loading && <div style={{ textAlign: "center", color: "#f7e7b6" }}>Loading units...</div>}
        {error && <div style={{ color: "salmon", textAlign: "center" }}>{error}</div>}
        {actionMessage && <div style={{ color: "lightgreen", textAlign: "center" }}>{actionMessage}</div>}
        {!loading && units.length === 0 && (
          <div style={{ textAlign: "center", color: "#f7e7b6", fontSize: "1.1rem" }}>
            No units found.
          </div>
        )}

        <div className="unit-grid">
          {units.map((unit) => {
            const images = safeParseImages(unit.images);
            return (
              <div key={unit.id} className="unit-card">
                {images.length > 0 ? (
                  <div className="unit-image-container">
                    <img
                      src={`https://may-space-backend.onrender.com${images[0]}`}
                      alt="unit"
                      className="unit-image"
                      onClick={() => openImageModal(unit, 0)}
                    />
                    {images.length > 1 && (
                      <div className="image-count-badge">
                        images {images.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="unit-image-placeholder">
                    No Image Available
                  </div>
                )}

                <div className="unit-card-content">
                  <h4>{unit.unit_number} • {unit.building_name}</h4>
                  <p><strong>📍 Location:</strong> {unit.location}</p>
                  <p><strong>👤 Owner:</strong> {unit.owner_username}</p>
                  <p><strong>📧 Email:</strong> {unit.owner_email}</p>
                  <p><strong>📞 Contact:</strong> {unit.contact_person} / {unit.phone_number}</p>
                  <p><strong>🏠 Specs:</strong> {unit.specifications}</p>
                  {unit.special_features && (
                    <p><strong>⭐ Features:</strong> {unit.special_features}</p>
                  )}
                  
                  <div className="unit-actions">
                    {images.length > 0 && (
                      <button
                        className="view-images-btn"
                        onClick={() => openImageModal(unit, 0)}
                      >
                        View Images ({images.length})
                      </button>
                    )}
                    <button
                      className="delete-unit-btn"
                      onClick={() => openDeleteModal(unit.id)}
                    >
                        Delete Unit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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

      {showImageModal && selectedUnit && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              &times;
            </button>
            
            <div className="image-modal-header">
              <h3>{selectedUnit.unit_number} • {selectedUnit.building_name}</h3>
              <p>{selectedUnit.location}</p>
            </div>

            <div className="image-viewer">
              <button className="nav-arrow left" onClick={prevImage}>
                ‹
              </button>
              
              <img
                src={`https://may-space-backend.onrender.com${safeParseImages(selectedUnit.images)[currentImageIndex]}`}
                alt={`Unit ${currentImageIndex + 1}`}
                className="viewer-image"
              />
              
              <button className="nav-arrow right" onClick={nextImage}>
                ›
              </button>
              
              <div className="image-counter">
                {currentImageIndex + 1} / {safeParseImages(selectedUnit.images).length}
              </div>
            </div>

            <div className="image-thumbnails">
              {safeParseImages(selectedUnit.images).map((image, index) => (
                <img
                  key={index}
                  src={`https://may-space-backend.onrender.com${image}`}
                  alt={`Thumbnail ${index + 1}`}
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUnitFinderManager;