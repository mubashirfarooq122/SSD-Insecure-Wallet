const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 AS connected');
    if (result.rows && result.rows.length > 0) {
      return res.status(200).json({ status: 'ok' });
    }
    return res.status(500).json({ status: 'error', message: 'No response from database' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);

// Serve static client frontend
app.use(express.static(path.resolve(__dirname, '../../client')));

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Secure Wallet server running on port ${PORT}`);
});

module.exports = { app, server };

