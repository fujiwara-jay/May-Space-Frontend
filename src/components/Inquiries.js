import React, { useEffect, useState } from "react";
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

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    fetchInquiries();
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  return (
    <>
      <div className="top-navigation-container">
        <div className="back-button-top-container">
          <button className="back-btn-top" onClick={handleBack}>
            ⬅ Back
          </button>
        </div>
        
        <div></div>
      </div>

      <div className="notifications-container">
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
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="inquiries-container">
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
              <div key={inquiry.id} className="inquiry-card">
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
    </>
  );
}

export default Inquiries;