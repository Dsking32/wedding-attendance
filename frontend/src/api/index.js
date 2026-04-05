import axios from 'axios';

const API = axios.create({ 
  baseURL: 'https://wedding-attendance-api.onrender.com/api' 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);

export const getGuests = (params) => API.get('/guests', { params });
export const getStats = () => API.get('/guests/stats');
export const addGuest = (data) => API.post('/guests', data);
export const bulkImport = (guests) => API.post('/guests/bulk', { guests });
export const deleteGuest = (id) => API.delete(`/guests/${id}`);
export const getQR = (id) => API.get(`/guests/${id}/qr`);

export const validateCheckin = (data) => API.post('/checkin/validate', data);
export const getCheckinLogs = () => API.get('/checkin/logs');