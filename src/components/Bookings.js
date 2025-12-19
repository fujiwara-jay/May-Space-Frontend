import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Bookings.css";

function Bookings() {
  const API_BASE = "https://may-space-backend.onrender.com";
  
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
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
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
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        throw new Error(errorData.message || `Failed to update booking`);
      }
      
      const data = await res.json();
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

      // Fetch my bookings
      const myRes = await fetch(`${API_BASE}/bookings/my`, { 
        headers,
      });
      
      if (!myRes.ok) {
        if (myRes.status === 401) {
          localStorage.removeItem("userId");
          localStorage.removeItem("userType");
          navigate("/home");
          return;
        }
        
        const errorText = await myRes.text();
        let myData;
        try {
          myData = JSON.parse(errorText);
        } catch {
          throw new Error(`Failed to fetch my bookings: HTTP ${myRes.status}`);
        }
        throw new Error(myData.message || `Failed to fetch my bookings`);
      }
      
      const myData = await myRes.json();
      setMyBookings(myData.bookings || myData || []);

      // Fetch rented units bookings
      const rentedRes = await fetch(`${API_BASE}/bookings/rented`, { 
        headers,
      });
      
      if (!rentedRes.ok) {
        if (rentedRes.status === 401) {
          localStorage.removeItem("userId");
          localStorage.removeItem("userType");
          navigate("/home");
          return;
        }
        
        const errorText = await rentedRes.text();
        let rentedData;
        try {
          rentedData = JSON.parse(errorText);
        } catch {
          throw new Error(`Failed to fetch rented bookings: HTTP ${rentedRes.status}`);
        }
        throw new Error(rentedData.message || `Failed to fetch rented bookings`);
      }
      
      const rentedData = await rentedRes.json();
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
                    {booking.status === 'pending' && (
                      <span className="pending-note"> (Awaiting confirmation)</span>
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
                  {booking.status === 'confirmed' && (
                    <div className="confirmed-message">
                      ✅ Booking Confirmed - Cannot re-book this unit
                    </div>
                  )}
                  {booking.status === 'denied' && (
                    <div className="denied-message">
                      ❌ Denied - You can re-book this unit from Unit Finder
                    </div>
                  )}
                  {booking.status === 'pending' && (
                    <div className="pending-message">
                      ⏳ Booking Pending - Awaiting owner's confirmation
                    </div>
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
                      <button className="confirm-btn" onClick={() => handleStatusUpdate(booking.id, "confirmed")}>
                        Confirm
                      </button>
                      <button className="deny-btn" onClick={() => handleStatusUpdate(booking.id, "denied")}>
                        Deny
                      </button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <div className="owner-confirmed-message">
                      ✅ Confirmed - User cannot re-book this unit
                    </div>
                  )}
                  {booking.status === "denied" && (
                    <div className="owner-denied-message">
                      ❌ Denied - User can re-book this unit
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