import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userType");
    navigate("/home");
  };

  const handleUnitFinder = () => {
    navigate("/unitfinder");
  };

  const handlePostUnit = () => {
    navigate("/post-unit");
  };

  const handleMessageInquiries = () => {
    navigate("/message-inquiries");
  };

  const handleBookings = () => {
    navigate("/bookings");
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1 className="dashboard-title">May Space: A Web-Based Rental Unit Space Finder</h1>
      </div>
      <div className="dashboard-buttons">
        <button className="unit-finder-btn" onClick={handleUnitFinder}>
          Unit Finder
        </button>
        <button className="post-unit-btn" onClick={handlePostUnit}>
          Post an Available Unit
        </button>
        <button className="unit-finder-btn" onClick={handleMessageInquiries}>
          Message Inquiries
        </button>
        <button className="unit-finder-btn" onClick={handleBookings}>
          Bookings
        </button>
      </div>
      <div className="logout-container">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;