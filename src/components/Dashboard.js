import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const res = await fetch(`https://may-space-backend.onrender.com/inquiries`, {
          headers: { "X-User-ID": userId },
        });
        if (!res.ok) return;
        
        const data = await res.json();
        const inquiries = data.inquiries || [];
        
        let count = 0;
        const lastVisit = localStorage.getItem(`lastInquiryVisit_${userId}`) || Date.now();
        
        inquiries.forEach(inquiry => {
          if (inquiry.replies && inquiry.replies.length > 0) {
            inquiry.replies.forEach(reply => {
              const replyTime = new Date(reply.created_at).getTime();
              if (replyTime > lastVisit && reply.sender_user_id !== parseInt(userId)) {
                count++;
              }
            });
          }
        });
        
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
        <button className="unit-finder-btn message-inquiries-btn" onClick={handleMessageInquiries}>
          Message Inquiries
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
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