import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import debateRoutes from './routes/debateRoutes.js';

dotenv.config();

const app = express();
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://0.0.0.0:5173',
];
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || defaultOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/+$/, ''))
  .filter(Boolean);
const isDevelopment = (process.env.NODE_ENV || 'development') !== 'production';

function isPrivateNetworkOrigin(origin) {
  try {
    const { hostname, protocol } = new URL(origin);
    const isHttp = protocol === 'http:' || protocol === 'https:';
    const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    const isPrivateIp =
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);

    return isHttp && (isLoopback || isPrivateIp);
  } catch {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace?.(/\/+$/, '');

    if (
      !normalizedOrigin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(normalizedOrigin) ||
      (isDevelopment && isPrivateNetworkOrigin(normalizedOrigin))
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/debates', debateRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan internal pada server: ' + err.message });
});

export default app;
