import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds timeout, since AI model generation might take some time
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
