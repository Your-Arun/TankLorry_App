// backend/server.js
// Main Express server entry point

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const stockRoutes = require('./routes/stockRoutes');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

// Enable CORS for all origins (restrict in production)
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🛢️ Tank Lorry Smart Manager API is running',
    version: '1.0.0',
  });
});

// Stock entry routes at /api/stock
app.use('/api/stock', stockRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on :${PORT}`);
});
