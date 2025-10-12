import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Bookings.css";

function Bookings() {
  const formatPrice = (price) => {
    if (!price) return "Not specified";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return price;
    return `₱${numPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const [myBookings, setMyBookings] = useState([]);
  const [rentedUnits, setRentedUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
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
    if (userId) fetchBookings();
    else setLoading(false);
  }, [userId]);

  return (
    <div className="bookings-container">
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
            <div className="no-inquiries">No bookings made yet.</div>
          ) : (
            myBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-info">
                  <div><strong>Unit:</strong> {booking.unit_number} ({booking.building_name})</div>
                  <div><strong>Location:</strong> {booking.location}</div>
                  <div><strong>Price:</strong> {formatPrice(booking.unitPrice || booking.unit_price || booking.price)}</div>
                  <div><strong>Status:</strong> {booking.status}</div>
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
            <div className="no-inquiries">No one has booked your units yet.</div>
          ) : (
            rentedUnits.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-info">
                  <div><strong>Unit:</strong> {booking.unit_number} ({booking.building_name})</div>
                  <div><strong>Location:</strong> {booking.location}</div>
                  <div><strong>Price:</strong> {formatPrice(booking.unitPrice || booking.unit_price || booking.price)}</div>
                  <div><strong>Booked By:</strong> {booking.name}</div>
                  <div><strong>Status:</strong> {booking.status}</div>
                  <div><strong>Date:</strong> {new Date(booking.created_at).toLocaleString()}</div>
                </div>
                <div className="booking-actions">
                  {booking.status === "pending" && (
                    <>
                      <button className="confirm-btn" onClick={() => handleStatusUpdate(booking.id, "confirmed")}>Confirm</button>
                      <button className="deny-btn" onClick={() => handleStatusUpdate(booking.id, "denied")}>Deny</button>
                    </>
                  )}
                  {booking.status === "confirmed" && <span style={{ color: '#4caf50', fontWeight: 700 }}>Confirmed</span>}
                  {booking.status === "denied" && <span style={{ color: '#e57373', fontWeight: 700 }}>Denied</span>}
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
