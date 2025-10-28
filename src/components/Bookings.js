import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function BookUnit() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    numberOfPeople: '',
    transactionType: 'Walk-in',
    dateOfVisiting: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const bookingData = {
        unitId: unitId,
        name: formData.name,
        address: formData.address,
        contactNumber: formData.contactNumber,
        numberOfPeople: parseInt(formData.numberOfPeople),
        transactionType: formData.transactionType,
        dateOfVisiting: formData.dateOfVisiting
      };

      console.log('Sending booking data:', bookingData);

      const res = await fetch('https://may-space-backend.onrender.com/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      alert('Booking created successfully!');
      navigate('/bookings');
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date for input field (YYYY-MM-DD)
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="book-unit-container">
      <h2>Book Unit</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Current Address:</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contactNumber">Contact Number:</label>
          <input
            type="tel"
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="numberOfPeople">Number of People:</label>
          <input
            type="number"
            id="numberOfPeople"
            name="numberOfPeople"
            value={formData.numberOfPeople}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="transactionType">Transaction Type:</label>
          <select
            id="transactionType"
            name="transactionType"
            value={formData.transactionType}
            onChange={handleChange}
            required
          >
            <option value="Walk-in">Walk-in Visit</option>
            <option value="Online Transaction">Online Transaction</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dateOfVisiting">Date Visiting Unit:</label>
          <input
            type="date"
            id="dateOfVisiting"
            name="dateOfVisiting"
            value={formData.dateOfVisiting}
            onChange={handleChange}
            min={getTodayDate()}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Submit Booking'}
        </button>
      </form>
    </div>
  );
}

export default BookUnit;