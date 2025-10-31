import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  // Check if user is authenticated as admin
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    const userId = localStorage.getItem("userId");
    
    if (!userId || userType !== "admin") {
      navigate("/home");
      return;
    }
  }, [navigate]);

  const handleUnitFinderManager = () => {
    navigate("/admin/unit-finder-manager");
  };

  const handleAccountManage = () => {
    navigate("/admin/account-manage");
  };

  const handleLogout = () => {
    // Clear all stored authentication data
    localStorage.removeItem("userId");
    localStorage.removeItem("userType");
    localStorage.removeItem("username");
    navigate("/home");
  };

  return (
    <div className="adminDashboard-container">
      <div className="admin-header">
        <h1 className="admin-dashboard-title">Admin Dashboard</h1>
        <p className="welcome-message">
          Welcome, {localStorage.getItem("username") || "Admin"}
        </p>
      </div>
      <div className="adminDashboard-buttons">
        <button className="unit-finder-btn" onClick={handleUnitFinderManager}>
          Unit Finder Manager
        </button>
        <button className="account-manage-btn" onClick={handleAccountManage}>
          Account Manage
        </button>
        <button className="logout-admin-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;