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
      const res = await fetch(`http://localhost:5000/inquiries`, {
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
    if (!replyMessage.trim()) return;
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
          recipientUserId:
            inquiry.sender_user_id === parseInt(userId)
              ? inquiry.recipient_user_id
              : inquiry.sender_user_id,
        }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      setReplyMessage("");
      setActiveInquiryId(null);
      fetchInquiries();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleReplies = (inquiryId) => {
    setShowReplies((prev) => ({ ...prev, [inquiryId]: !prev[inquiryId] }));
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
          const isPoster = parseInt(userId) === inquiry.recipient_user_id;
          const isSender = parseInt(userId) === inquiry.sender_user_id;
          return (
            <div key={inquiry.id} className="inquiry-card">
              <div className="inquiry-info">
                <div><strong>Building:</strong> {inquiry.building_name}</div>
                <div><strong>Unit Number:</strong> {inquiry.unit_number}</div>
                <div><strong>Location:</strong> {inquiry.location}</div>
                <div><strong>From:</strong> User #{inquiry.sender_user_id}</div>
                <div><strong>To:</strong> User #{inquiry.recipient_user_id}</div>
                <div><strong>Message:</strong> {inquiry.message}</div>
                <div><strong>Date:</strong> {new Date(inquiry.created_at).toLocaleString()}</div>
              </div>

              {isPoster && activeInquiryId === inquiry.id ? (
                <div className="reply-section">
                  <textarea
                    value={replyMessage}
                    onChange={handleReplyChange}
                    placeholder="Type your reply..."
                    rows={3}
                  />
                  <button className="send-reply-btn" onClick={() => handleSendReply(inquiry)}>
                    Send Reply
                  </button>
                  <button className="cancel-reply-btn" onClick={() => setActiveInquiryId(null)}>
                    Cancel
                  </button>
                </div>
              ) : isPoster ? (
                <button className="reply-btn" onClick={() => handleReplyClick(inquiry.id)}>
                  Reply
                </button>
              ) : null}

              {inquiry.replies && inquiry.replies.length > 0 && (
                <div className="replies-section">
                  <button className="reply-btn" onClick={() => toggleReplies(inquiry.id)}>
                    {showReplies[inquiry.id]
                      ? "Hide Replies"
                      : `Show Replies (${inquiry.replies.length})`}
                  </button>
                  {showReplies[inquiry.id] && (
                    <div className="replies-list">
                      {inquiry.replies.map((reply) => (
                        <div key={reply.id} className="reply-card">
                          <div><strong>From:</strong> User #{reply.sender_user_id}</div>
                          <div><strong>To:</strong> User #{reply.recipient_user_id}</div>
                          <div><strong>Message:</strong> {reply.message}</div>
                          <div><strong>Date:</strong> {new Date(reply.created_at).toLocaleString()}</div>
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
        <h3>Replies to My Inquiries</h3>
        {inquiries.filter(
          (i) =>
            parseInt(userId) === i.sender_user_id &&
            i.replies &&
            i.replies.length > 0 &&
            !i.parent_inquiry_id
        ).length === 0 && (
          <div className="no-inquiries">No replies to your inquiries yet.</div>
        )}

        {inquiries
          .filter(
            (i) =>
              parseInt(userId) === i.sender_user_id &&
              i.replies &&
              i.replies.length > 0 &&
              !i.parent_inquiry_id
          )
          .map((inquiry) => (
            <div key={inquiry.id} className="inquiry-card">
              <div className="inquiry-info">
                <div><strong>Building:</strong> {inquiry.building_name}</div>
                <div><strong>Unit Number:</strong> {inquiry.unit_number}</div>
                <div><strong>Location:</strong> {inquiry.location}</div>
                <div><strong>Message:</strong> {inquiry.message}</div>
                <div><strong>Date:</strong> {new Date(inquiry.created_at).toLocaleString()}</div>
              </div>
              <div className="replies-list">
                {inquiry.replies.map((reply) => (
                  <div key={reply.id} className="reply-card">
                    <div><strong>From:</strong> User #{reply.sender_user_id}</div>
                    <div><strong>To:</strong> User #{reply.recipient_user_id}</div>
                    <div><strong>Message:</strong> {reply.message}</div>
                    <div><strong>Date:</strong> {new Date(reply.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Inquiries;
