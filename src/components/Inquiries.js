import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../cssfiles/Inquiries.css";

function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [activeInquiryId, setActiveInquiryId] = useState(null);
  const [showReplies, setShowReplies] = useState({});
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

  const handleReplyClick = (inquiryId) => {
    setActiveInquiryId(inquiryId);
    setReplyMessage("");
  };

  const handleReplyChange = (e) => {
    setReplyMessage(e.target.value);
  };

  const handleSendReply = async (inquiry) => {
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
      
      setReplyMessage("");
      setActiveInquiryId(null);
      fetchInquiries();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleReplies = (inquiryId) => {
    setShowReplies((prev) => ({ 
      ...prev, 
      [inquiryId]: !prev[inquiryId] 
    }));
  };

  const canReplyToInquiry = (inquiry) => {
    const isRecipient = parseInt(userId) === inquiry.recipient_user_id;
    const isSender = parseInt(userId) === inquiry.sender_user_id;
    const hasReplies = inquiry.replies && inquiry.replies.length > 0;
    
    return isRecipient || (isSender && hasReplies);
  };

  const getLatestReply = (inquiry) => {
    if (!inquiry.replies || inquiry.replies.length === 0) return null;
    return inquiry.replies[inquiry.replies.length - 1];
  };

  return (
    <div className="inquiries-container">
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

          const isRecipient = parseInt(userId) === inquiry.recipient_user_id;
          const isSender = parseInt(userId) === inquiry.sender_user_id;
          const canReply = canReplyToInquiry(inquiry);
          const latestReply = getLatestReply(inquiry);

          return (
            <div key={inquiry.id} className="inquiry-card">
              <div className="inquiry-header">
                <h4>{inquiry.building_name} - {inquiry.unit_number}</h4>
                <span className="inquiry-badge">
                  {isSender ? "Your Inquiry" : "Inquiry to You"}
                </span>
              </div>

              <div className="inquiry-info">
                <div><strong>Location:</strong> {inquiry.location}</div>
                <div><strong>From:</strong> User #{inquiry.sender_user_id}</div>
                <div><strong>To:</strong> User #{inquiry.recipient_user_id}</div>
                <div className="message-content">
                  <strong>Message:</strong> {inquiry.message}
                </div>
                <div className="inquiry-date">
                  {new Date(inquiry.created_at).toLocaleString()}
                </div>
              </div>

              {latestReply && (
                <div className="latest-reply">
                  <strong>Latest Reply:</strong> 
                  <div className="reply-preview">
                    {latestReply.message}
                  </div>
                  <div className="reply-date">
                    {new Date(latestReply.created_at).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Reply Section */}
              {canReply && activeInquiryId === inquiry.id ? (
                <div className="reply-section">
                  <textarea
                    value={replyMessage}
                    onChange={handleReplyChange}
                    placeholder="Type your reply..."
                    rows={3}
                    className="reply-textarea"
                  />
                  <div className="reply-actions">
                    <button 
                      className="send-reply-btn" 
                      onClick={() => handleSendReply(inquiry)}
                      disabled={!replyMessage.trim()}
                    >
                      Send Reply
                    </button>
                    <button 
                      className="cancel-reply-btn" 
                      onClick={() => setActiveInquiryId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : canReply ? (
                <button 
                  className="reply-btn" 
                  onClick={() => handleReplyClick(inquiry.id)}
                >
                  Reply
                </button>
              ) : null}

              {/* Show All Replies */}
              {inquiry.replies && inquiry.replies.length > 0 && (
                <div className="replies-section">
                  <button 
                    className="toggle-replies-btn" 
                    onClick={() => toggleReplies(inquiry.id)}
                  >
                    {showReplies[inquiry.id]
                      ? "Hide Replies"
                      : `Show All Replies (${inquiry.replies.length})`}
                  </button>
                  {showReplies[inquiry.id] && (
                    <div className="replies-list">
                      {inquiry.replies.map((reply, index) => (
                        <div key={reply.id} className={`reply-card ${index % 2 === 0 ? 'even' : 'odd'}`}>
                          <div className="reply-header">
                            <span><strong>From:</strong> User #{reply.sender_user_id}</span>
                            <span><strong>To:</strong> User #{reply.recipient_user_id}</span>
                          </div>
                          <div className="reply-message">
                            {reply.message}
                          </div>
                          <div className="reply-date">
                            {new Date(reply.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="my-inquiries-section">
        <h3>My Sent Inquiries</h3>
        {inquiries.filter(
          (i) => parseInt(userId) === i.sender_user_id && !i.parent_inquiry_id
        ).length === 0 ? (
          <div className="no-inquiries">You haven't sent any inquiries yet.</div>
        ) : (
          inquiries
            .filter((i) => parseInt(userId) === i.sender_user_id && !i.parent_inquiry_id)
            .map((inquiry) => (
              <div key={inquiry.id} className="inquiry-card my-inquiry">
                <div className="inquiry-header">
                  <h4>{inquiry.building_name} - {inquiry.unit_number}</h4>
                  <span className="inquiry-badge sent">Sent by You</span>
                </div>
                
                <div className="inquiry-info">
                  <div><strong>Location:</strong> {inquiry.location}</div>
                  <div><strong>To:</strong> User #{inquiry.recipient_user_id}</div>
                  <div className="message-content">
                    <strong>Your Message:</strong> {inquiry.message}
                  </div>
                  <div className="inquiry-date">
                    {new Date(inquiry.created_at).toLocaleString()}
                  </div>
                </div>

                {inquiry.replies && inquiry.replies.length > 0 ? (
                  <div className="replies-list">
                    <h5>Replies ({inquiry.replies.length}):</h5>
                    {inquiry.replies.map((reply) => (
                      <div key={reply.id} className="reply-card">
                        <div className="reply-header">
                          <span><strong>From:</strong> User #{reply.sender_user_id}</span>
                        </div>
                        <div className="reply-message">
                          {reply.message}
                        </div>
                        <div className="reply-date">
                          {new Date(reply.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-replies">
                    No replies yet.
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default Inquiries;