import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Inquiries.css";

function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyMessages, setReplyMessages] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(fetchInquiries, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://may-space-backend.onrender.com/inquiries`, {
        headers: { "X-User-ID": userId },
      });
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      const data = await res.json();
      setInquiries(data.inquiries || []);
      
      generateNotifications(data.inquiries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = (inquiries) => {
    const newNotifications = [];
    
    inquiries.forEach(inquiry => {
      if (inquiry.replies && inquiry.replies.length > 0) {
        inquiry.replies.forEach(reply => {
          if (reply.sender_user_id !== parseInt(userId)) {
            const existingNotification = notifications.find(
              notif => notif.id === `reply-${reply.id}`
            );
            
            if (!existingNotification) {
              newNotifications.push({
                id: `reply-${reply.id}`,
                type: 'new_reply',
                message: `New reply from ${reply.sender_name || 'User'} in ${inquiry.building_name}`,
                inquiryId: inquiry.id,
                timestamp: reply.created_at,
                read: false
              });
            }
          }
        });
      }
      
      if (inquiry.recipient_user_id === parseInt(userId) && 
          inquiry.sender_user_id !== parseInt(userId)) {
        const existingNotification = notifications.find(
          notif => notif.id === `inquiry-${inquiry.id}`
        );
        
        if (!existingNotification) {
          newNotifications.push({
            id: `inquiry-${inquiry.id}`,
            type: 'new_inquiry',
            message: `New inquiry from ${inquiry.sender_name || 'User'} about ${inquiry.building_name}`,
            inquiryId: inquiry.id,
            timestamp: inquiry.created_at,
            read: false
          });
        }
      }
    });
    
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
    }
  };

  const handleReplyChange = (inquiryId, message) => {
    setReplyMessages(prev => ({
      ...prev,
      [inquiryId]: message
    }));
  };

  const handleSendReply = async (inquiry) => {
    const replyMessage = replyMessages[inquiry.id] || "";
    
    if (!replyMessage.trim()) {
      setError("Please enter a reply message");
      return;
    }

    try {
      const res = await fetch(`https://may-space-backend.onrender.com/inquiries/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": userId,
        },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          message: replyMessage.trim(),
          recipientUserId: inquiry.sender_user_id === parseInt(userId) 
            ? inquiry.recipient_user_id 
            : inquiry.sender_user_id,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send reply");
      }
      
      setReplyMessages(prev => ({
        ...prev,
        [inquiry.id]: ""
      }));
      
      markNotificationsAsReadByInquiryId(inquiry.id);
      
      fetchInquiries();
    } catch (err) {
      setError(err.message);
    }
  };

  const canReplyToInquiry = (inquiry) => {
    const isRecipient = parseInt(userId) === inquiry.recipient_user_id;
    const isSender = parseInt(userId) === inquiry.sender_user_id;
    
    return isRecipient || isSender;
  };

  const getAllMessages = (inquiry) => {
    const messages = [];
    
    messages.push({
      id: inquiry.id,
      message: inquiry.message,
      sender_user_id: inquiry.sender_user_id,
      sender_name: inquiry.sender_name,
      created_at: inquiry.created_at,
      type: 'original'
    });
    
    if (inquiry.replies && inquiry.replies.length > 0) {
      inquiry.replies.forEach(reply => {
        messages.push({
          id: reply.id,
          message: reply.message,
          sender_user_id: reply.sender_user_id,
          sender_name: reply.sender_name,
          created_at: reply.created_at,
          type: 'reply'
        });
      });
    }
    
    return messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  };

  const isMyMessage = (message) => {
    return parseInt(userId) === message.sender_user_id;
  };

  const getDisplayName = (message) => {
    if (isMyMessage(message)) {
      return 'You';
    }
    return message.sender_name || `User #${message.sender_user_id}`;
  };

  const getConversationTitle = (inquiry) => {
    const isSender = parseInt(userId) === inquiry.sender_user_id;
    if (isSender) {
      return `Conversation with ${inquiry.recipient_name || `User #${inquiry.recipient_user_id}`}`;
    } else {
      return `Conversation with ${inquiry.sender_name || `User #${inquiry.sender_user_id}`}`;
    }
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markNotificationsAsReadByInquiryId = (inquiryId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.inquiryId === inquiryId ? { ...notif, read: true } : notif
      )
    );
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    setShowNotifications(false);
    
    const inquiryElement = document.getElementById(`inquiry-${notification.inquiryId}`);
    if (inquiryElement) {
      inquiryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inquiryElement.style.backgroundColor = 'rgba(224, 193, 109, 0.2)';
      setTimeout(() => {
        inquiryElement.style.backgroundColor = '';
      }, 2000);
    }
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="inquiries-container">
      <div className="notifications-container" ref={notificationRef}>
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
              <h4>Notifications</h4>
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
              <div className="no-notifications">No new notifications</div>
            ) : (
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatNotificationTime(notification.timestamp)}
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

      <h2>Message Inquiries</h2>

      {loading && <div className="loading">Loading inquiries...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && inquiries.length === 0 && (
        <div className="no-inquiries">No inquiries found.</div>
      )}

      <div className="inquiries-list">
        {inquiries.map((inquiry) => {
          if (inquiry.parent_inquiry_id) return null;

          const canReply = canReplyToInquiry(inquiry);
          const allMessages = getAllMessages(inquiry);
          const currentReply = replyMessages[inquiry.id] || "";

          return (
            <div key={inquiry.id} id={`inquiry-${inquiry.id}`} className="inquiry-card">
              <div className="inquiry-header">
                <h4>{inquiry.building_name} - {inquiry.unit_number}</h4>
                <span className="inquiry-badge">
                  {parseInt(userId) === inquiry.sender_user_id ? "Your Inquiry" : "Inquiry to You"}
                </span>
              </div>

              <div className="inquiry-info">
                <div><strong>Location:</strong> {inquiry.location}</div>
                <div><strong>Conversation:</strong> {getConversationTitle(inquiry)}</div>
              </div>

              <div className="conversation-container">
                <div className="messages-list">
                  {allMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-bubble ${isMyMessage(message) ? 'my-message' : 'other-message'}`}
                    >
                      <div className="message-content">
                        {message.message}
                      </div>
                      <div className="message-time">
                        {new Date(message.created_at).toLocaleString()}
                      </div>
                      <div className="message-sender">
                        {getDisplayName(message)}
                      </div>
                    </div>
                  ))}
                </div>

                {canReply && (
                  <div className="reply-section">
                    <textarea
                      value={currentReply}
                      onChange={(e) => handleReplyChange(inquiry.id, e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="reply-textarea"
                    />
                    <div className="reply-actions">
                      <button 
                        className="send-reply-btn" 
                        onClick={() => handleSendReply(inquiry)}
                        disabled={!currentReply.trim()}
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Inquiries;