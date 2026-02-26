// backend/controllers/stockController.js
// Express controller functions for stock entry CRUD operations

const StockEntry = require('../models/StockEntry');
const { getIndentDecision } = require('../utils/decisionEngine');

// ─────────────────────────────────────────────
// @desc    Create a new stock entry
// @route   POST /api/stock
// @access  Public
// ─────────────────────────────────────────────
const createEntry = async (req, res) => {
  try {
    const { tank1, tank2, avgSale } = req.body;

    // Basic validation
    if (tank1 === undefined || tank2 === undefined || avgSale === undefined) {
      return res.status(400).json({
        success: false,
        message: 'tank1, tank2, and avgSale are required fields.',
      });
    }

    const totalStock = Number(tank1) + Number(tank2);

    // Run decision engine
    const decision = getIndentDecision(Number(tank1), Number(tank2), Number(avgSale));

    // Build and save document
    const entry = await StockEntry.create({
      tank1: Number(tank1),
      tank2: Number(tank2),
      avgSale: Number(avgSale),
      totalStock,
      suggestedIndent: decision.suggestedIndent,
      isEmergency: decision.isEmergency,
      reason: decision.reason,
      daysLeft: decision.daysLeft,
    });

    res.status(201).json({
      success: true,
      message: 'Entry saved successfully.',
      data: entry,
    });
  } catch (error) {
    console.error('createEntry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while saving entry.',
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get latest stock entry
// @route   GET /api/stock/latest
// @access  Public
// ─────────────────────────────────────────────
const getLatestEntry = async (req, res) => {
  try {
    const entry = await StockEntry.findOne().sort({ createdAt: -1 });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'No entries found.',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('getLatestEntry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all stock entries (paginated)
// @route   GET /api/stock/history?page=1&limit=20
// @access  Public
// ─────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      StockEntry.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      StockEntry.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: entries,
    });
  } catch (error) {
    console.error('getHistory error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete a stock entry by ID
// @route   DELETE /api/stock/:id
// @access  Public
// ─────────────────────────────────────────────
const deleteEntry = async (req, res) => {
  try {
    const entry = await StockEntry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Entry deleted successfully.',
    });
  } catch (error) {
    console.error('deleteEntry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createEntry, getLatestEntry, getHistory, deleteEntry };
