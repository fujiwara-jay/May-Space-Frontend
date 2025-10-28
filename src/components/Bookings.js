import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Bookings.css";

function Bookings() {
  const formatPrice = (price) => {
    if (!price && price !== 0) return "Not specified";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "Not specified";
    return `₱${numPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      const res = await fetch(`https://may-space-backend.onrender.com/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to update booking`);
      setActionMessage(`Booking ${status}`);
      setNotifications(prev => prev.filter(notif => notif.bookingId !== bookingId));
      setTimeout(() => setActionMessage(""), 2000);
      fetchBookings();
    } catch (err) {
      setActionMessage(err.message);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { "X-User-ID": userId };
      
      const myRes = await fetch("https://may-space-backend.onrender.com/bookings/my", { headers });
      const myData = await myRes.json();
      if (!myRes.ok) throw new Error(myData.message || "Failed to fetch my bookings");
      setMyBookings(myData.bookings || []);

      const rentedRes = await fetch("https://may-space-backend.onrender.com/bookings/rented", { headers });
      const rentedData = await rentedRes.json();
      if (!rentedRes.ok) throw new Error(rentedData.message || "Failed to fetch rented bookings");
      setRentedUnits(rentedData.bookings || []);
    } catch (err) {
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
    }
  }, [userId]);

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
      {actionMessage && <div className="success-message">{actionMessage}</div>}

      <div className="bookings-section">
        <h3>My Bookings</h3>
        <div className="booking-list">
          {myBookings.length === 0 ? (
            <div className="no-bookings">No bookings made yet.</div>
          ) : (
            myBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-info">
                  <div><strong>Unit:</strong> {booking.unit_number} ({booking.building_name})</div>
                  <div><strong>Location:</strong> {booking.location}</div>
                  <div><strong>Price:</strong> {formatPrice(booking.unit_price)}</div>
                  <div><strong>Status:</strong> 
                    <span className={`status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div><strong>Booked By:</strong> {booking.name}</div>
                  <div><strong>Contact:</strong> {booking.contact_number}</div>
                  <div><strong>Number of People:</strong> {booking.number_of_people}</div>
                  <div><strong>Date:</strong> {new Date(booking.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bookings-section">
        <h3>My Rented Units (Bookings for My Units)</h3>
        <div className="booking-list">
          {rentedUnits.length === 0 ? (
            <div className="no-bookings">No one has booked your units yet.</div>
          ) : (
            rentedUnits.map((booking) => (
              <div key={booking.id} id={`booking-${booking.id}`} className="booking-card">
                <div className="booking-info">
                  <div><strong>Unit:</strong> {booking.unit_number} ({booking.building_name})</div>
                  <div><strong>Location:</strong> {booking.location}</div>
                  <div><strong>Price:</strong> {formatPrice(booking.unit_price)}</div>
                  <div><strong>Booked By:</strong> {booking.name}</div>
                  <div><strong>Contact:</strong> {booking.contact_number}</div>
                  <div><strong>Number of People:</strong> {booking.number_of_people}</div>
                  <div><strong>Status:</strong> 
                    <span className={`status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div><strong>Date:</strong> {new Date(booking.created_at).toLocaleString()}</div>
                </div>
                <div className="booking-actions">
                  {booking.status === "pending" && (
                    <>
                      <button className="confirm-btn" onClick={() => handleStatusUpdate(booking.id, "confirmed")}>Confirm</button>
                      <button className="deny-btn" onClick={() => handleStatusUpdate(booking.id, "denied")}>Deny</button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <span className="status-confirmed">Confirmed</span>
                  )}
                  {booking.status === "denied" && (
                    <span className="status-denied">Denied</span>
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