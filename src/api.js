import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth API
export const register = (username, email, password) => api.post('/register', { username, email, password });
export const login = (username, password) => api.post('/login', { username, password });

// Units API
export const getUnits = () => api.get('/units');
export const getMyUnits = () => api.get('/my-units');
export const createUnit = (unitData) => {
  const formData = new FormData();
  Object.keys(unitData).forEach(key => {
    if (key === 'images') {
      unitData.images.forEach(image => {
        formData.append('images', image);
      });
    } else {
      formData.append(key, unitData[key]);
    }
  });
  return api.post('/units', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
export const updateUnit = (id, unitData) => {
  const formData = new FormData();
  Object.keys(unitData).forEach(key => {
    if (key === 'images') {
      unitData.images.forEach(image => {
        formData.append('images', image);
      });
    } else {
      formData.append(key, unitData[key]);
    }
  });
  return api.put(`/units/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
export const deleteUnit = (id) => api.delete(`/units/${id}`);

// Bookings API
export const createBooking = (bookingData) => api.post('/bookings', bookingData);
export const getMyBookings = () => api.get('/my-bookings');

// Inquiries API
export const createInquiry = (inquiryData) => api.post('/inquiries', inquiryData);
export const getMyInquiries = () => api.get('/my-inquiries');

export default api;