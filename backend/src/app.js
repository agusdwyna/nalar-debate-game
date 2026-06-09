import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import debateRoutes from './routes/debateRoutes.js';

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());

// Main debate routes
app.use('/api/debates', debateRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan internal pada server: ' + err.message });
});

export default app;
