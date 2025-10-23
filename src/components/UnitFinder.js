import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/UnitFinder.css";

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

const API_BASE = process.env.REACT_APP_API_URL || "https://may-space-backend.onrender.com";

const UnitFinder = () => {
  const navigate = useNavigate();
  const [allUnits, setAllUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalUnit, setModalUnit] = useState(null);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showInquireForm, setShowInquireForm] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);

  const [bookingDetails, setBookingDetails] = useState({
    name: "",
    address: "",
    contact: "",
    numberOfPeople: "",
    transaction: "Online",
    date: "",
    unitId: null,
  });

  const [inquireDetails, setInquireDetails] = useState({
    message: "",
    unitId: null,
    unitOwnerId: null,
    unitOwnerContactPerson: "",
  });

  const [fetchError, setFetchError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [inquireError, setInquireError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, target: null });
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("userId");
  const isGuest = !userId || userId === "guest";

  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    fetchAllUnits();
    if (isGuest) {
      setShowGuestPopup(true);
      setTimeout(() => {
        setShowGuestPopup(false);
      }, 2500);
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUnits(allUnits);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = allUnits.filter(unit => 
        unit.unit_number?.toLowerCase().includes(term) ||
        unit.building_name?.toLowerCase().includes(term) ||
        unit.location?.toLowerCase().includes(term) ||
        unit.contact_person?.toLowerCase().includes(term) ||
        unit.specifications?.toLowerCase().includes(term) ||
        unit.unitPrice?.toLowerCase().includes(term) ||
        unit.special_features?.toLowerCase().includes(term) ||
        (unit.price && unit.price.toString().includes(term))
      );
      setFilteredUnits(filtered);
    }
  }, [searchTerm, allUnits]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userType");
    navigate("/home");
  };

  const getAuthHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    if (userId && userId !== "guest") {
      headers["X-User-ID"] = userId;
    }
    return headers;
  };

  const fetchAllUnits = async () => {
    setFetchError(null);
    setLoading(true);
    
    const controller = new AbortController();
    
    try {
      const res = await fetch(`${API_BASE}/public/units`, { 
        signal: controller.signal 
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      const normalized = (data.units || []).map((u) => {
        const imgs = safeParseImages(u.images);
        const images = imgs.map((p) => (p && p.startsWith("/") ? `${API_BASE}${p}` : p));
        const unitPrice = u.unitPrice || u.price || null;
        return {
          ...u,
          images,
          unitPrice,
          price: unitPrice
        };
      });

      if (mountedRef.current) {
        setAllUnits(normalized);
        setFilteredUnits(normalized);
      }
    } catch (err) {
      if (err.name !== "AbortError" && mountedRef.current) {
        console.error("fetchAllUnits error:", err);
        setFetchError(`Failed to load units: ${err.message}`);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleImageClick = (imageUrl, unit, imageIndex) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(imageIndex);
    setModalUnit(unit);
  };

  const showPrevImage = () => {
    if (!modalUnit?.images?.length) return;
    const len = modalUnit.images.length;
    const newIndex = (currentImageIndex - 1 + len) % len;
    setCurrentImageIndex(newIndex);
    setSelectedImage(modalUnit.images[newIndex]);
  };

  const showNextImage = () => {
    if (!modalUnit?.images?.length) return;
    const len = modalUnit.images.length;
    const newIndex = (currentImageIndex + 1) % len;
    setCurrentImageIndex(newIndex);
    setSelectedImage(modalUnit.images[newIndex]);
  };

  const closeViewer = () => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
    setModalUnit(null);
  };

  const closeModal = () => {
    setModalUnit(null);
    setShowBookingForm(false);
    setShowInquireForm(false);
    setBookingError(null);
    setInquireError(null);
    setActionMessage(null);
  };

  const handleAboutClick = () => {
    navigate("/about");
  };

  const handleStudentProjectsClick = () => {
    navigate("/studentProjects");
  };

  const handleProjectToolsClick = () => {
    navigate("/tools");
  };

  const handleOpenLocation = (e) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    const locationUrl = "https://maps.app.goo.gl/Hk3iwYC7tftpJZuG8";
    window.open(locationUrl, "_blank", "noopener,noreferrer");
  };

  const handleBookNowClick = (e, unit) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }

    if (isGuest) {
      setActionMessage("Please log in to book a unit.");
      return;
    }

    setShowBookingForm(true);
    setShowInquireForm(false);
    setModalUnit(unit);
    setBookingDetails((prev) => ({
      ...prev,
      unitId: unit.id,
      name: "",
      address: "",
      contact: "",
      numberOfPeople: "",
      transaction: "Online",
      date: ""
    }));
    setBookingError(null);
    setActionMessage(null);
  };

  const handleInquireClick = (e, unit) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }

    if (isGuest) {
      setActionMessage("Please log in to inquire about a unit.");
      return;
    }

    setShowInquireForm(true);
    setShowBookingForm(false);
    setModalUnit(unit);
    setInquireDetails({
      message: "",
      unitId: unit.id,
      unitOwnerId: unit.user_id,
      unitOwnerContactPerson: unit.contact_person || "",
    });
    setInquireError(null);
    setActionMessage(null);
  };

  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleInquireInputChange = (e) => {
    const { name, value } = e.target;
    setInquireDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setBookingError(null);
    setActionMessage(null);

    const { name, address, contact, numberOfPeople, transaction, date, unitId } = bookingDetails;
    if (!name || !address || !contact || !numberOfPeople || !transaction || !date) {
      setBookingError("All booking fields are required.");
      return;
    }

    const selectedDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setBookingError("Please select a future date.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          unitId,
          name,
          address,
          contactNumber: contact,
          numberOfPeople: parseInt(numberOfPeople, 10),
          transaction,
          dateVisiting: date,
        }),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      setActionMessage("Booking successfully made!");
      setShowBookingForm(false);
      setBookingDetails({
        name: "",
        address: "",
        contact: "",
        numberOfPeople: "",
        transaction: "Online",
        date: "",
        unitId: null,
      });

      setTimeout(() => {
        if (mountedRef.current) setModalUnit(null);
      }, 1400);
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(`Failed to make booking: ${err.message}`);
    }
  };

  const handleSubmitInquire = async (e) => {
    e.preventDefault();
    setInquireError(null);
    setActionMessage(null);

    const { message, unitId, unitOwnerId } = inquireDetails;
    if (!message || !message.trim()) {
      setInquireError("Message cannot be empty.");
      return;
    }
    if (message.trim().length < 10) {
      setInquireError("Message should be at least 10 characters long.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/inquiries`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          unitId,
          message: message.trim(),
          unitOwnerId,
        }),
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      setActionMessage(`Message sent to ${inquireDetails.unitOwnerContactPerson || "owner"}!`);
      setShowInquireForm(false);
      setInquireDetails({
        message: "",
        unitId: null,
        unitOwnerId: null,
        unitOwnerContactPerson: "",
      });

      setTimeout(() => {
        if (mountedRef.current) setModalUnit(null);
      }, 1400);
    } catch (err) {
      console.error("Inquiry error:", err);
      setInquireError(`Failed to send inquiry: ${err.message}`);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "Not specified";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return price;
    return `₱${numPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderModalContent = () => {
    if (!modalUnit) return null;

    if (showBookingForm) {
      return (
        <>
          <h3>Book Unit - {modalUnit?.unit_number}</h3>
          {bookingError && <div className="error-message">{bookingError}</div>}
          {actionMessage && <div className="success-message">{actionMessage}</div>}
          <form onSubmit={handleSubmitBooking}>
            <label>
              Full Name:
              <input
                type="text"
                name="name"
                value={bookingDetails.name}
                onChange={handleBookingInputChange}
                placeholder="Enter your full name"
                required
              />
            </label>
            <label>
              Current Address:
              <input
                type="text"
                name="address"
                value={bookingDetails.address}
                onChange={handleBookingInputChange}
                placeholder="Enter your current address"
                required
              />
            </label>
            <label>
              Contact Number:
              <input
                type="tel"
                name="contact"
                value={bookingDetails.contact}
                onChange={handleBookingInputChange}
                placeholder="Enter your contact number"
                required
              />
            </label>
            <label>
              Number of People:
              <input
                type="number"
                name="numberOfPeople"
                value={bookingDetails.numberOfPeople}
                onChange={handleBookingInputChange}
                min="1"
                max="20"
                placeholder="Number of people visiting"
                required
              />
            </label>
            <label>
              Transaction Type:
              <select name="transaction" value={bookingDetails.transaction} onChange={handleBookingInputChange}>
                <option value="Online">Online Transaction</option>
                <option value="Walk-in">Walk-in Visit</option>
              </select>
            </label>
            <label>
              Date Visiting Unit:
              <input
                type="date"
                name="date"
                value={bookingDetails.date}
                onChange={handleBookingInputChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>Submit Booking</button>
              <button type="button" onClick={() => setShowBookingForm(false)} className="back-btn">Back to Details</button>
            </div>
          </form>
        </>
      );
    }

    if (showInquireForm) {
      return (
        <>
          <h3>Inquire About Unit - {modalUnit?.unit_number}</h3>
          {inquireError && <div className="error-message">{inquireError}</div>}
          {actionMessage && <div className="success-message">{actionMessage}</div>}
          <div className="inquiry-info">
            <p><strong>Contact Person:</strong> {modalUnit?.contact_person}</p>
            <p><strong>Phone:</strong> {modalUnit?.phone_number}</p>
            <p><strong>Price:</strong> {formatPrice(modalUnit?.unitPrice || modalUnit?.price)}</p>
          </div>
          <form onSubmit={handleSubmitInquire}>
            <label>
              Your Message:
              <textarea
                className="inquire-textarea"
                name="message"
                value={inquireDetails.message}
                onChange={handleInquireInputChange}
                placeholder="Type your detailed message or questions here... (minimum 10 characters)"
                rows="6"
                required
              />
              <div className="char-count">
                {inquireDetails.message.length}/500 characters
              </div>
            </label>
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>Send Inquiry</button>
              <button type="button" onClick={() => setShowInquireForm(false)} className="back-btn">Back to Details</button>
            </div>
          </form>
        </>
      );
    }

    return (
      <>
        <div className="property-info">
          <h3>{modalUnit.unit_number} in {modalUnit.location}</h3>
          <div className="property-details">
            <p><strong>Building:</strong> {modalUnit.building_name}</p>
            <p><strong>Contact Person:</strong> {modalUnit.contact_person}</p>
            <p><strong>Phone Number:</strong> {modalUnit.phone_number}</p>
            <p><strong>Specifications:</strong> {modalUnit.specifications}</p>
            <p><strong>Special Features:</strong> {modalUnit.special_features}</p>
            <p><strong>Price:</strong> {formatPrice(modalUnit.unitPrice || modalUnit.price)}</p>
          </div>
        </div>

        {modalUnit.images?.length > 0 && (
          <div className="unit-images-gallery">
            <h4>Unit Images ({modalUnit.images.length})</h4>
            <div className="images-grid">
              {modalUnit.images.map((img, idx) => (
                <div key={idx} className="image-container">
                  <img
                    src={img}
                    alt={`${modalUnit.building_name} - Image ${idx + 1}`}
                    className="gallery-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(img, modalUnit, idx);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="unit-actions">
          <div
            className="action-wrapper"
            onMouseEnter={() => isGuest && setTooltip({ show: true, target: "book" })}
            onMouseLeave={() => setTooltip({ show: false, target: null })}
          >
            <button
              className="book-now-btn"
              onClick={(e) => handleBookNowClick(e, modalUnit)}
              disabled={isGuest || loading}
            >
              📅 Book Now
            </button>
            {tooltip.show && tooltip.target === "book" && (
              <div className="button-tooltip">Please Login to use this feature</div>
            )}
          </div>

          <div
            className="action-wrapper"
            onMouseEnter={() => isGuest && setTooltip({ show: true, target: "inquire" })}
            onMouseLeave={() => setTooltip({ show: false, target: null })}
          >
            <button
              className="inquire-btn"
              onClick={(e) => handleInquireClick(e, modalUnit)}
              disabled={isGuest || loading}
            >
              💬 Inquire Further
            </button>
            {tooltip.show && tooltip.target === "inquire" && (
              <div className="button-tooltip">Please Login to use this feature</div>
            )}
          </div>

          <div className="action-wrapper">
            <button
              className="location-btn"
              onClick={handleOpenLocation}
              title="View Location on Google Maps"
            >
              📍 View Location
            </button>
          </div>

          <button className="unitclose-btn" onClick={closeModal}>✕ Close</button>
        </div>
      </>
    );
  };

  return (
    <div className="unit-finder-container">
      <div className="unit-finder-header">
        <div className="unit-finder-header-buttons">
          <button
            className="back-button"
            onClick={() => navigate(isGuest ? "/home" : "/dashboard")}
          >
            {isGuest ? "Go to Login" : "Go to Dashboard"}
          </button>

          {!isGuest && (
            <button
              className="logout-button"
              onClick={handleLogout}
              title="Log out"
            >
              Log Out
            </button>
          )}
        </div>
        <h1>May Space</h1>
        <h2>A Web-Based Rental Unit Space Finder</h2>
        <h3>Available Units ({filteredUnits.length})</h3>
        
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by unit number, building, location, contact person, price..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={handleClearSearch}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="search-results-info">
              Showing {filteredUnits.length} of {allUnits.length} units
              {filteredUnits.length === 0 && " - No matching units found"}
            </div>
          )}
        </div>
      </div>

      {fetchError && <div className="error-message">{fetchError}</div>}
      {actionMessage && !modalUnit && <div className="success-message">{actionMessage}</div>}

      {loading && <div style={{ color: "#f7e7b6", marginBottom: 12 }}>Loading units...</div>}

      {filteredUnits.length === 0 && !fetchError && !loading ? (
        <div className="no-units">
          <p>No units available at the moment.</p>
        </div>
      ) : (
        <div className="unit-grid">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="unit-card"
              onClick={() => setModalUnit(unit)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setModalUnit(unit); }}
            >
              <div className="unit-image-container">
                {unit.images?.length > 0 ? (
                  <img
                    src={unit.images[0]}
                    alt={`${unit.building_name} ${unit.unit_number}`}
                    className="unit-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(unit.images[0], unit, 0);
                    }}
                  />
                ) : (
                  <div className="unit-image-placeholder">No Image Available</div>
                )}
                {unit.images?.length > 1 && (
                  <div className="image-count-badge">
                    View {unit.images.length}
                  </div>
                )}
              </div>
              <div className="unit-card-content">
                <h4>{unit.unit_number} • {unit.building_name}</h4>
                <p><strong>Location:</strong> {unit.location}</p>
                <p><strong>Contact Person:</strong> {unit.contact_person}</p>
                <p><strong>Price:</strong> {formatPrice(unit.unitPrice || unit.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalUnit && !selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {renderModalContent()}
          </div>
        </div>
      )}

      {selectedImage && modalUnit && (
        <div className="image-modal-overlay" onClick={closeViewer}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeViewer}>
              &times;
            </button>
            
            <div className="image-modal-header">
              <h3>{modalUnit.unit_number} • {modalUnit.building_name}</h3>
              <p>{modalUnit.location}</p>
            </div>

            <div className="image-viewer">
              <button className="nav-arrow left" onClick={showPrevImage}>
                ‹
              </button>
              
              <img
                src={selectedImage}
                alt={`Unit ${currentImageIndex + 1}`}
                className="viewer-image"
              />
              
              <button className="nav-arrow right" onClick={showNextImage}>
                ›
              </button>
              
              <div className="image-counter">
                {currentImageIndex + 1} / {modalUnit.images.length}
              </div>
            </div>

            <div className="image-thumbnails">
              {modalUnit.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    setSelectedImage(image);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showGuestPopup && (
        <div className="guest-popup">
          <strong>Guest Mode Limited</strong>
          <p>Book Now and Inquire features are disabled.</p>
        </div>
      )}

      <footer className="unit-finder-footer">
        <div className="footer-links">
          <button 
            className="footer-btn" 
            onClick={handleAboutClick}
          >
            About
          </button>
          <button 
            className="footer-btn" 
            onClick={handleStudentProjectsClick}
          >
            StudentProjects
          </button>
          <button 
            className="footer-btn" 
            onClick={handleProjectToolsClick}
          >
            Project Tools
          </button>
        </div>
        <p className="footer-copyright">
          © 2025 May Space A Web-Based Rental Unit Space Finder. Student Project BSIT-PTC
        </p>
      </footer>
    </div>
  );
};

export default UnitFinder;