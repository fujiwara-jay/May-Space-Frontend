import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Renter.css"; 

function Renter() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.role === "renter") {
      setUser(savedUser);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="renter-dashboard">
      <header className="renter-header">
        <h1>🏠 Renter Dashboard</h1>
        {user && <p>Welcome, {user.username}!</p>}
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <main className="renter-content">
        <section>
          <h2>Available Units</h2>
          <p>Here you can browse and book rental units.</p>
        </section>
      </main>
    </div>
  );
}

export default Renter;
