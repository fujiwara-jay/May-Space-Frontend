import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Admin.css";

function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser && savedUser.role === "admin") {
      setUser(savedUser);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) {
    return (
      <div className="admin-dashboard">
        <p>Loading admin data...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>⚙️ Admin Dashboard</h1>
          <p>Welcome, {user.username} (Admin)</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <main className="admin-content">
        <section>
          <h2>Manage Renters</h2>
          <p>View, update, or delete renter accounts.</p>
        </section>

        <section>
          <h2>Manage Units</h2>
          <p>Add, update, or remove rental units.</p>
        </section>

        <section>
          <h2>Manage Bookings</h2>
          <p>View and update renter bookings.</p>
        </section>

        <section>
          <h2>Manage Inquiries</h2>
          <p>View and respond to renter inquiries.</p>
        </section>

        <section>
          <h2>Reports</h2>
          <p>View system activity and booking reports.</p>
        </section>
      </main>
    </div>
  );
}

export default Admin;
