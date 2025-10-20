import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [bookingUpdatesCount, setBookingUpdatesCount] = useState(0);

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
    const userId = localStorage.getItem("userId");
    localStorage.setItem(`lastInquiryVisit_${userId}`, Date.now());
    setUnreadCount(0);
    navigate("/message-inquiries");
  };

  const handleBookings = () => {
    const userId = localStorage.getItem("userId");
    localStorage.setItem(`lastBookingVisit_${userId}`, Date.now());
    localStorage.setItem(`lastBookingUpdateVisit_${userId}`, Date.now());
    setPendingBookingsCount(0);
    setBookingUpdatesCount(0);
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

    const fetchPendingBookingsCount = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const res = await fetch(`https://may-space-backend.onrender.com/bookings`, {
          headers: { "X-User-ID": userId },
        });
        if (!res.ok) return;
        
        const data = await res.json();
        const bookings = data.bookings || [];
        
        let pendingCount = 0;
        let updatesCount = 0;
        const lastBookingVisit = localStorage.getItem(`lastBookingVisit_${userId}`) || Date.now();
        const lastBookingUpdateVisit = localStorage.getItem(`lastBookingUpdateVisit_${userId}`) || Date.now();
        
        bookings.forEach(booking => {
          const bookingTime = new Date(booking.created_at).getTime();
          const updateTime = new Date(booking.updated_at || booking.created_at).getTime();
          
          if (booking.status === 'pending' && bookingTime > lastBookingVisit) {
            pendingCount++;
          }
          
          if ((booking.status === 'confirmed' || booking.status === 'denied') && 
              updateTime > lastBookingUpdateVisit && 
              bookingTime <= lastBookingUpdateVisit) {
            updatesCount++;
          }
        });
        
        setPendingBookingsCount(pendingCount);
        setBookingUpdatesCount(updatesCount);
      } catch (error) {
        console.error("Error fetching pending bookings count:", error);
      }
    };

    fetchUnreadCount();
    fetchPendingBookingsCount();
    
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPendingBookingsCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const totalBookingsBadgeCount = pendingBookingsCount + bookingUpdatesCount;

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
            <span className="notification-badge corner">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button className="unit-finder-btn bookings-btn" onClick={handleBookings}>
          Bookings
          {totalBookingsBadgeCount > 0 && (
            <span className="notification-badge bookings-badge corner">
              {totalBookingsBadgeCount > 99 ? '99+' : totalBookingsBadgeCount}
            </span>
          )}
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