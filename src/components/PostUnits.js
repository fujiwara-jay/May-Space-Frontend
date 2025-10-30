import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/PostUnits.css";

function PostUnits() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitDetails, setUnitDetails] = useState({
    buildingName: "",
    unitNumber: "",
    specs: "",
    location: "",
    specialFeatures: "",
    unitPrice: "",
    contactPerson: "",
    phoneNumber: "",
    newImages: [],
    existingImages: [],
  });
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [showPostedUnits, setShowPostedUnits] = useState(false);

  const postedUnitsRef = useRef(null);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    fetchPostedUnits();
  }, [userId, navigate]);

  const getAuthHeaders = () => {
    return {
      'X-User-ID': userId,
    };
  };

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

  const fetchUnitImages = async (unitId) => {
    try {
      const response = await fetch(`https://may-space-backend.onrender.com/api/units/${unitId}/images`);
      if (response.ok) {
        const data = await response.json();
        return data.images || [];
      }
    } catch (error) {
      console.error(`Error fetching images for unit ${unitId}:`, error);
    }
    return [];
  };

  const fetchPostedUnits = async () => {
    setFetchError(null);
    try {
      const response = await fetch('https://may-space-backend.onrender.com/units', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Fetch images for each unit
      const unitsWithImages = await Promise.all(
        data.units.map(async (unit) => {
          const images = await fetchUnitImages(unit.id);
          return {
            ...unit,
            images: images.length > 0 ? images : safeParseImages(unit.images)
          };
        })
      );
      
      setUnits(unitsWithImages);
    } catch (error) {
      console.error("Error fetching posted units:", error);
      setFetchError(`Failed to fetch your units: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUnitDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    const { value } = e.target;
    const numericValue = value.replace(/[^\d.]/g, '');
    const cleanValue = numericValue.replace(/(\..*)\./g, '$1');
    setUnitDetails((prev) => ({ ...prev, unitPrice: cleanValue }));
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    setUnitDetails((prev) => ({ ...prev, newImages: [...prev.newImages, ...files] }));
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setUnitDetails((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    setUnitDetails((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handlePostUnit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setActionMessage(null);

    if (!unitDetails.buildingName.trim() || !unitDetails.unitNumber.trim() || !unitDetails.specs.trim()) {
      setFormError("Please fill in all required fields: Building Name, Unit Number, and Specifications.");
      return;
    }

    if (!unitDetails.unitPrice.trim() || isNaN(parseFloat(unitDetails.unitPrice))) {
      setFormError("Please enter a valid price.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('buildingName', unitDetails.buildingName);
    formData.append('unitNumber', unitDetails.unitNumber);
    formData.append('location', unitDetails.location);
    formData.append('specs', unitDetails.specs);
    formData.append('specialFeatures', unitDetails.specialFeatures);
    formData.append('unitPrice', unitDetails.unitPrice);
    formData.append('contactPerson', unitDetails.contactPerson);
    formData.append('phoneNumber', unitDetails.phoneNumber);
    unitDetails.newImages.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const response = await fetch('https://may-space-backend.onrender.com/units', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      setUploading(false);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setActionMessage("Unit posted successfully!");
      setUnitDetails({
        buildingName: "",
        unitNumber: "",
        specs: "",
        location: "",
        specialFeatures: "",
        unitPrice: "",
        contactPerson: "",
        phoneNumber: "",
        newImages: [],
        existingImages: [],
      });
      fetchPostedUnits();
    } catch (error) {
      console.error("Error posting unit:", error);
      setFormError(`Failed to post unit: ${error.message}`);
      setUploading(false);
    }
  };

  const handleEditUnit = async (id) => {
    setFormError(null);
    setActionMessage(null);
    try {
      const response = await fetch(`https://may-space-backend.onrender.com/units/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Fetch unit images as base64
      const unitImages = await fetchUnitImages(id);
      
      setUnitDetails({
        buildingName: data.unit.building_name,
        unitNumber: data.unit.unit_number,
        specs: data.unit.specifications,
        location: data.unit.location,
        specialFeatures: data.unit.special_features,
        unitPrice: data.unit.unitprice || data.unit.unitPrice,
        contactPerson: data.unit.contact_person,
        phoneNumber: data.unit.phone_number,
        newImages: [],
        existingImages: unitImages,
      });
      setEditingUnitId(data.unit.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error fetching unit for edit:", error);
      setFormError(`Failed to load unit for editing: ${error.message}`);
    }
  };

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setActionMessage(null);

    if (!unitDetails.buildingName.trim() || !unitDetails.unitNumber.trim() || !unitDetails.specs.trim()) {
      setFormError("Please fill in all required fields: Building Name, Unit Number, and Specifications.");
      return;
    }

    if (!unitDetails.unitPrice.trim() || isNaN(parseFloat(unitDetails.unitPrice))) {
      setFormError("Please enter a valid price.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('buildingName', unitDetails.buildingName);
    formData.append('unitNumber', unitDetails.unitNumber);
    formData.append('location', unitDetails.location);
    formData.append('specs', unitDetails.specs);
    formData.append('specialFeatures', unitDetails.specialFeatures);
    formData.append('unitPrice', unitDetails.unitPrice); 
    formData.append('contactPerson', unitDetails.contactPerson);
    formData.append('phoneNumber', unitDetails.phoneNumber);
    formData.append('existingImages', JSON.stringify(unitDetails.existingImages));
    unitDetails.newImages.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const response = await fetch(`https://may-space-backend.onrender.com/units/${editingUnitId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData,
      });

      setUploading(false);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setActionMessage("Unit updated successfully!");
      setUnitDetails({
        buildingName: "",
        unitNumber: "",
        specs: "",
        location: "",
        specialFeatures: "",
        unitPrice: "",
        contactPerson: "",
        phoneNumber: "",
        newImages: [],
        existingImages: [],
      });
      setEditingUnitId(null);
      fetchPostedUnits();
    } catch (error) {
      console.error("Error updating unit:", error);
      setFormError(`Failed to update unit: ${error.message}`);
      setUploading(false);
    }
  };

  // ADDED MISSING FUNCTIONS
  const handleDeleteUnit = (id) => {
    setUnitToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    setFormError(null);
    setActionMessage(null);
    try {
      const response = await fetch(`https://may-space-backend.onrender.com/units/${unitToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setActionMessage("Unit deleted successfully!");
      fetchPostedUnits();
      if (unitToDelete === editingUnitId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Error deleting unit:", error);
      setFormError(`Failed to delete unit: ${error.message}`);
    }
    setShowDeleteModal(false);
    setUnitToDelete(null);
  };

  const cancelDeleteUnit = () => {
    setShowDeleteModal(false);
    setUnitToDelete(null);
  };

  const handleCancelEdit = () => {
    setUnitDetails({
      buildingName: "",
      unitNumber: "",
      specs: "",
      location: "",
      specialFeatures: "",
      unitPrice: "",
      contactPerson: "",
      phoneNumber: "",
      newImages: [],
      existingImages: [],
    });
    setEditingUnitId(null);
    setFormError(null);
    setActionMessage(null);
  };

  const handleBackButtonClick = () => {
    navigate("/unitfinder");
  };

  const togglePostedUnitsView = () => {
    const newShowState = !showPostedUnits;
    setShowPostedUnits(newShowState);
    
    if (newShowState) {
      setTimeout(() => {
        postedUnitsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "Not specified";
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) return price;
    
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numPrice);
  };

  const formatPriceForInput = (price) => {
    if (!price) return "";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? price : numPrice.toString();
  };

  return (
    <div className="post-units-container">
      {showDeleteModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <h3>Delete Unit?</h3>
            <p>Are you sure you want to delete this unit? This action cannot be undone.</p>
            <div className="modal-btn-group">
              <button className="modal-delete-btn" onClick={confirmDeleteUnit}>Delete</button>
              <button className="modal-cancel-btn" onClick={cancelDeleteUnit}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="top-navigation-container">
        <div className="back-button-top-container">
          <button className="back-btn-top" onClick={handleBackButtonClick}>
            ⬅ Back
          </button>
        </div>
        
        <div className="view-posted-btn-top-container">
          <button 
            className={`view-posted-btn-top ${showPostedUnits ? 'hide' : 'view'}`} 
            onClick={togglePostedUnitsView}
          >
            {showPostedUnits ? "Hide Posted Apartments" : "View Posted Apartments"}
          </button>
        </div>
      </div>

      <div className="form-container">
        <h2>{editingUnitId ? "Update Unit" : "Post a New Unit"}</h2>
        {formError && <div className="error-message">{formError}</div>}
        {actionMessage && <div className="success-message">{actionMessage}</div>}
        <form onSubmit={editingUnitId ? handleUpdateUnit : handlePostUnit}>
          <label>
            Building Name: <span style={{ color: "red" }}>*</span>
            <input
              type="text"
              name="buildingName"
              value={unitDetails.buildingName}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Unit's Number: <span style={{ color: "red" }}>*</span>
            <input
              type="text"
              name="unitNumber"
              value={unitDetails.unitNumber}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Location:
            <input
              type="text"
              name="location"
              value={unitDetails.location}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Specifications: <span style={{ color: "red" }}>*</span>
            <input
              type="text"
              name="specs"
              value={unitDetails.specs}
              onChange={handleInputChange}
              required
            />
          </label>

          <label>
            Special Features:
            <input
              type="text"
              name="specialFeatures"
              value={unitDetails.specialFeatures}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Unit's Price (PHP): <span style={{ color: "red" }}>*</span>
            <div className="price-input-container">
              <span className="currency-symbol">₱</span>
              <input
                type="text"
                name="unitPrice"
                value={formatPriceForInput(unitDetails.unitPrice)}
                onChange={handlePriceChange}
                required
                placeholder="e.g., 1500.00"
                className="price-input"
              />
            </div>
            {unitDetails.unitPrice && (
              <div className="price-preview">
                Preview: {formatPrice(unitDetails.unitPrice)}
              </div>
            )}
          </label>

          <label>
            Contact Person:
            <input
              type="text"
              name="contactPerson"
              value={unitDetails.contactPerson}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Phone Number:
            <input
              type="text"
              name="phoneNumber"
              value={unitDetails.phoneNumber}
              onChange={handleInputChange}
            />
          </label>

          <label>
            Upload Images:
            <input type="file" accept="image/*" multiple onChange={handleNewImageChange} />
          </label>

          {unitDetails.newImages.length > 0 && (
            <div className="image-preview-container">
              <h4>New Image Previews:</h4>
              <div className="image-previews">
                {unitDetails.newImages.map((img, index) => (
                  <div key={`new-${index}`} className="image-preview-item">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`New Preview ${index + 1}`}
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleRemoveNewImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unitDetails.existingImages && unitDetails.existingImages.length > 0 && (
            <div className="image-preview-container">
              <h4>Existing Images:</h4>
              <div className="image-previews">
                {unitDetails.existingImages.map((img, index) => (
                  <div key={`existing-${index}`} className="image-preview-item">
                    <img
                      src={img.base64 || img} // Use base64 if available, fallback to URL
                      alt={`Existing ${index + 1}`}
                      style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "4px" }}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleRemoveExistingImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="button-group">
            <button type="submit" className="post-btn" disabled={uploading}>
              {uploading ? "Uploading..." : (editingUnitId ? "Update Unit" : "Post Unit")}
            </button>
            {editingUnitId && (
              <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div ref={postedUnitsRef} className={`posted-units-container ${showPostedUnits ? 'visible' : 'hidden'}`}>
        <div className="posted-units-header">
          <h2>Your Posted Apartments</h2>
        </div>
        {fetchError && <div className="error-message">{fetchError}</div>}
        {units.length === 0 && !fetchError ? (
          <p>No units posted yet.</p>
        ) : (
          <div className="posted-units-list">
            {units.map((unit) => (
              <div key={unit.id} className="posted-unit-card">
                {unit.images && unit.images.length > 0 && (
                  <div className="unit-images-carousel">
                    {unit.images.map((img, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={img.base64 || `https://may-space-backend.onrender.com${img}`}
                        alt={`${unit.building_name} - ${unit.unit_number} (${imgIndex + 1})`}
                        className="unit-image"
                      />
                    ))}
                  </div>
                )}
                <h3>{unit.unit_number}</h3>
                <p><strong>Building Name:</strong> {unit.building_name}</p>
                <p><strong>Specifications:</strong> {unit.specifications}</p>
                <p><strong>Location:</strong> {unit.location}</p>
                <p><strong>Special Features:</strong> {unit.special_features}</p>
                <p><strong>Price:</strong> {formatPrice(unit.unitprice || unit.unitPrice)}</p>
                <p><strong>Contact Person:</strong> {unit.contact_person}</p>
                <p><strong>Phone Number:</strong> {unit.phone_number}</p>
                <div className="action-buttons">
                  <button className="edit-btn" onClick={() => handleEditUnit(unit.id)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteUnit(unit.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PostUnits;