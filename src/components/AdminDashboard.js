import React from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Dashboard.css";

function AdminDashboard() {
	const navigate = useNavigate();

	const handleUnitFinderManager = () => {
		navigate("/admin/unit-finder-manager");
	};

	const handleAccountManage = () => {
		navigate("/admin/account-manage");
	};

	const handleMessageInquiries = () => {
		navigate("/admin/message-inquiries");
	};

	const handleLogout = () => {
		localStorage.removeItem("userId");
		localStorage.removeItem("userType");
		navigate("/home");
	};

	return (
		<div className="dashboard-container">
			<div className="header">
				<h1 className="dashboard-title">Admin Dashboard</h1>
			</div>
			<div className="dashboard-buttons">
				<button className="unit-finder-btn" onClick={handleUnitFinderManager}>
					Unit Finder Manager
				</button>
				<button className="post-unit-btn" onClick={handleAccountManage}>
					Account Manage
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

export default AdminDashboard;