import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/AdminDashboard.css";

function AdminDashboard() {
	const navigate = useNavigate();

	const handleUnitFinderManager = () => {
		navigate("/admin/unit-finder-manager");
	};

	const handleAccountManage = () => {
		navigate("/admin/account-manage");
	};

	const handleAdminReport = () => {
		navigate("/admin/report");
	};

	const handleLogout = () => {
		localStorage.removeItem("userId");
		localStorage.removeItem("userType");
		navigate("/home");
	};

	return (
		<div className="adminDashboard-container">
			<div className="admin-header">
				<h1 className="admin-dashboard-title">Admin Dashboard</h1>
			</div>
			<div className="adminDashboard-buttons">
				<button className="unit-finder-btn" onClick={handleUnitFinderManager}>
					Unit Finder Manager
				</button>
				<button className="account-manage-btn" onClick={handleAccountManage}>
					Account Manage
				</button>
				<button className="report-btn" onClick={handleAdminReport}>
					Admin Report
				</button>
				<button className="logout-admin-btn" onClick={handleLogout}>
					Logout
				</button>
			</div>
		</div>
	);
}

export default AdminDashboard;