import axios from 'axios';

// Set REACT_APP_API_URL (e.g. http://localhost:5000/api) to run against a local server
export const API_URL =
  process.env.REACT_APP_API_URL || 'https://nipungo-backend.onrender.com/api';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach the login token to every request automatically
instance.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // localStorage unavailable — send request without a token
  }
  return config;
});

// Free-tier hosting sleeps when idle: ping the server as soon as the app loads
// so it's awake by the time the user logs in or books.
export const wakeServer = () => {
  fetch(API_URL.replace(/\/api\/?$/, '/health')).catch(() => {});
};

export default instance;
