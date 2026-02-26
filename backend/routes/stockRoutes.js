// backend/routes/stockRoutes.js
// Express router for stock entry API endpoints

const express = require('express');
const router = express.Router();
const {
  createEntry,
  getLatestEntry,
  getHistory,
  deleteEntry,
} = require('../controllers/stockController');

// POST   /api/stock          → Save new daily entry
router.post('/', createEntry);

// GET    /api/stock/latest   → Get most recent entry
router.get('/latest', getLatestEntry);

// GET    /api/stock/history  → Get paginated history
router.get('/history', getHistory);

// DELETE /api/stock/:id      → Delete an entry
router.delete('/:id', deleteEntry);

module.exports = router;
