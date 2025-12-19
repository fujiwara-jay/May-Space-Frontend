import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Bookings.css";

function Bookings() {
  const API_BASE = process.env.REACT_APP_API_URL || "https://may-space-backend.onrender.com";
  
  const formatPrice = (price) => {
    if (!price) return "Not specified";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return price;
    return `₱${numPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const [myBookings, setMyBookings] = useState([]);
  const [rentedUnits, setRentedUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [availableUnitsForReBooking, setAvailableUnitsForReBooking] = useState([]);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  // Check which units can be re-booked (denied or canceled bookings)
  const checkAvailableUnitsForReBooking = () => {
    const reBookableUnits = myBookings
      .filter(booking => 
        (booking.status === 'denied' || booking.status === 'cancelled') && 
        !availableUnitsForReBooking.some(unit => unit.unit_id === booking.unit_id)
      )
      .map(booking => ({
        unit_id: booking.unit_id,
        unit_number: booking.unit_number,
        building_name: booking.building_name,
        location: booking.location,
        price: booking.unitPrice || booking.unit_price || booking.price,
        denied_date: booking.created_at
      }));
    
    setAvailableUnitsForReBooking(reBookableUnits);
  };

  const checkForNewBookings = () => {
    const lastVisit = localStorage.getItem(`lastBookingVisit_${userId}`) || Date.now();
    const newNotifications = [];
    
    rentedUnits.forEach(booking => {
      const bookingTime = new Date(booking.created_at).getTime();
      if (bookingTime > lastVisit && booking.status === 'pending') {
        newNotifications.push({
          id: `booking-${booking.id}`,
          type: 'new_booking',
          message: `New booking request for ${booking.unit_number}`,
          bookingId: booking.id,
          timestamp: booking.created_at,
          read: false
        });
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem(`lastBookingVisit_${userId}`, Date.now());
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const handleStatusUpdate = async (bookingId, status) => {
    setActionMessage("");
    try {
      console.log(`Updating booking ${bookingId} to status: ${status}`);
      
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({ status }),
      });
      
      console.log(`Response status: ${res.status}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP ${res.status}: Failed to update booking`);
        } catch {
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
      }
      
      const data = await res.json();
      console.log("Success response:", data);
      
      setActionMessage(`Booking ${status} successfully!`);
      setNotifications(prev => prev.filter(notif => notif.bookingId !== bookingId));
      
      setTimeout(() => {
        fetchBookings();
        setActionMessage("");
      }, 1500);
      
    } catch (err) {
      console.error("Status update error:", err);
      setActionMessage(`Failed to update booking: ${err.message}`);
    }
  };

  const handleReBookUnit = (unit) => {
    navigate('/unitfinder', { 
      state: { 
        reBookUnit: unit,
        message: "You can now re-book this unit. Find it in the unit list."
      } 
    });
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return;
    
    setActionMessage("");
    try {
      console.log(`Cancelling booking ${bookingId}`);
      
      // Use the cancel endpoint
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
      });
      
      console.log(`Cancel response status: ${res.status}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Failed to cancel booking`;
        } catch {
          errorMessage = `HTTP ${res.status}: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      setActionMessage(data.message || "Booking cancelled successfully!");
      
      setTimeout(() => {
        fetchBookings();
        setActionMessage("");
      }, 1500);
      
    } catch (err) {
      console.error("Cancel booking error:", err);
      setActionMessage(`Failed to cancel booking: ${err.message}`);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId) {
        throw new Error("User not logged in. Please login first.");
      }

      const headers = { 
        "Content-Type": "application/json",
        "X-User-ID": userId 
      };

      console.log("Fetching bookings for user:", userId);
      
      // Fetch my bookings
      const myRes = await fetch(`${API_BASE}/bookings/my`, { 
        headers,
      });
      
      console.log("My bookings response status:", myRes.status);
      
      if (!myRes.ok) {
        if (myRes.status === 401) {
          localStorage.removeItem("userId");
          localStorage.removeItem("userType");
          navigate("/home");
          return;
        }
        
        const errorText = await myRes.text();
        console.error("My bookings error response:", errorText);
        throw new Error(`Failed to fetch my bookings: HTTP ${myRes.status}`);
      }
      
      const myData = await myRes.json();
      console.log("My bookings data received:", myData);
      setMyBookings(myData.bookings || myData || []);

      // Fetch rented units bookings
      const rentedRes = await fetch(`${API_BASE}/bookings/rented`, { 
        headers,
      });
      
      console.log("Rented bookings response status:", rentedRes.status);
      
      if (!rentedRes.ok) {
        if (rentedRes.status === 401) {
          localStorage.removeItem("userId");
          localStorage.removeItem("userType");
          navigate("/home");
          return;
        }
        
        const errorText = await rentedRes.text();
        console.error("Rented bookings error response:", errorText);
        throw new Error(`Failed to fetch rented bookings: HTTP ${rentedRes.status}`);
      }
      
      const rentedData = await rentedRes.json();
      console.log("Rented bookings data received:", rentedData);
      setRentedUnits(rentedData.bookings || rentedData || []);
      
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBookings();
      localStorage.setItem(`lastBookingVisit_${userId}`, Date.now());
    } else {
      setLoading(false);
      navigate("/home");
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (rentedUnits.length > 0) {
      checkForNewBookings();
    }
  }, [rentedUnits]);

  useEffect(() => {
    if (myBookings.length > 0) {
      checkAvailableUnitsForReBooking();
    }
  }, [myBookings]);

  return (
    <div className="bookings-container">
      <div className="notifications-container">
        <button 
          className="notifications-bell"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          🔔
          {getUnreadNotificationCount() > 0 && (
            <span className="notification-badge">
              {getUnreadNotificationCount()}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="notifications-dropdown">
            <div className="notifications-header">
              <h4>Booking Notifications</h4>
              {notifications.length > 0 && (
                <button 
                  className="clear-notifications-btn"
                  onClick={clearAllNotifications}
                >
                  Clear All
                </button>
              )}
            </div>
            
            {notifications.length === 0 ? (
              <div className="no-notifications">No new booking notifications</div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => {
                      markNotificationAsRead(notification.id);
                      setShowNotifications(false);
                      const bookingElement = document.getElementById(`booking-${notification.bookingId}`);
                      if (bookingElement) {
                        bookingElement.scrollIntoView({ behavior: 'smooth' });
                        bookingElement.style.backgroundColor = 'rgba(224, 193, 109, 0.1)';
                        setTimeout(() => {
                          bookingElement.style.backgroundColor = '';
                        }, 2000);
                      }
                    }}
                  >
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button className="back-button" onClick={handleBack}>
        ⬅ Back
      </button>

      <div className="bookings-header">Bookings</div>

      {loading && <div className="loading">Loading bookings...</div>}
      {error && <div className="error-message">{error}</div>}
      {actionMessage && <div className="action-message">{actionMessage}</div>}

      {/* Re-bookable Units Section */}
      {availableUnitsForReBooking.length > 0 && (
        <div className="bookings-section rebook-section">
          <h3>📋 Units Available for Re-booking</h3>
          <p className="section-subtitle">These units were denied or cancelled. You can book them again:</p>
          <div className="booking-list">
            {availableUnitsForReBooking.map((unit) => (
              <div key={unit.unit_id} className="booking-card rebook-card">
                <div className="booking-info">
                  <div><strong>Unit:</strong> {unit.unit_number} ({unit.building_name})</div>
                  <div><strong>Location:</strong> {unit.location}</div>
                  <div><strong>Price:</strong> {formatPrice(unit.price)}</div>
                  <div><strong>Status:</strong> 
                    <span className="status-denied">
                      Available for Re-booking
                    </span>
                  </div>
                  <div><strong>Last Booking Date:</strong> {formatDate(unit.denied_date)}</div>
                </div>
                <div className="booking-actions">
                  <button 
                    className="rebook-btn"
                    onClick={() => handleReBookUnit(unit)}
                  >
                    Re-book This Unit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bookings-section">
        <h3>📅 My Bookings</h3>
        <div className="booking-list">
          {myBookings.length === 0 ? (
            <div className="no-inquiries">No bookings made yet.</div>
          ) : (
            myBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-info">
                  <div><strong>Unit:</strong> {booking.unit_number} ({booking.building_name})</div>
                  <div><strong>Location:</strong> {booking.location}</div>
                  <div><strong>Price:</strong> {formatPrice(booking.unitPrice || booking.unit_price || booking.price)}</div>
                  <div><strong>Status:</strong> 
                    <span className={`status-${booking.status}`}>
                      {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                    </span>
                    {booking.status === 'confirmed' && (
                      <span className="confirmed-note"> (Cannot book this unit again)</span>
                    )}
                    {booking.status === 'denied' && (
                      <span className="denied-note"> (Can be re-booked)</span>
                    )}
                    {booking.status === 'cancelled' && (
                      <span className="cancelled-note"> (Can be re-booked)</span>
                    )}
                  </div>
                  <div><strong>Transaction Type:</strong> 
                    <span className="transaction-type">
                      {booking.transaction_type || "Not specified"}
                    </span>
                  </div>
                  <div><strong>Date of Visiting:</strong> 
                    <span className="visit-date">
                      {formatDate(booking.date_of_visiting)}
                    </span>
                  </div>
                  <div><strong>Booking Date:</strong> {new Date(booking.created_at).toLocaleString()}</div>
                </div>
                <div className="booking-actions">
                  {booking.status === 'pending' && (
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Booking
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <div className="confirmed-message">
                      ✅ Booking Confirmed - Cannot re-book
                    </div>
                  )}
                  {(booking.status === 'denied' || booking.status === 'cancelled') && (
                    <button 
                      className="rebook-btn"
                      onClick={() => handleReBookUnit({
                        unit_id: booking.unit_id,
                        unit_number: booking.unit_number,
                        building_name: booking.building_name,
                        location: booking.location,
                        price: booking.unitPrice || booking.unit_price || booking.price
                      })}
                    >
                      Re-book Unit
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bookings-section">
        <h3>🏠 My Rented Units (Bookings for My Units)</h3>
        <div className="booking-list">
          {rentedUnits.length === 0 ? (
            <div className="no-inquiries">No one has booked your units yet.</div>
          ) : (
            rentedUnits.map((booking) => (
              <div key={booking.id} id={`booking-${booking.id}`} className="booking-card">
                <div className="booking-info">
                  <div><strong>Unit:</strong> {booking.unit_number} ({booking.building_name})</div>
                  <div><strong>Location:</strong> {booking.location}</div>
                  <div><strong>Price:</strong> {formatPrice(booking.unitPrice || booking.unit_price || booking.price)}</div>
                  <div><strong>Booked By:</strong> {booking.name}</div>
                  <div><strong>Status:</strong> 
                    <span className={`status-${booking.status}`}>
                      {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                    </span>
                  </div>
                  <div><strong>Transaction Type:</strong> 
                    <span className="transaction-type">
                      {booking.transaction_type || "Not specified"}
                    </span>
                  </div>
                  <div><strong>Date of Visiting:</strong> 
                    <span className="visit-date">
                      {formatDate(booking.date_of_visiting)}
                    </span>
                  </div>
                  <div><strong>Booking Date:</strong> {new Date(booking.created_at).toLocaleString()}</div>
                </div>
                <div className="booking-actions">
                  {booking.status === "pending" && (
                    <>
                      <button className="confirm-btn" onClick={() => handleStatusUpdate(booking.id, "confirmed")}>Confirm</button>
                      <button className="deny-btn" onClick={() => handleStatusUpdate(booking.id, "denied")}>Deny</button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <div className="owner-confirmed-message">
                      ✅ Confirmed - User cannot re-book
                    </div>
                  )}
                  {booking.status === "denied" && (
                    <div className="owner-denied-message">
                      ❌ Denied - User can re-book
                    </div>
                  )}
                  {booking.status === "cancelled" && (
                    <div className="owner-cancelled-message">
                      📝 Cancelled by User - Can be re-booked
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Bookings;