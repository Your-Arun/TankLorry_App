// backend/models/StockEntry.js
// Mongoose schema for daily fuel stock entries

const mongoose = require('mongoose');

const StockEntrySchema = new mongoose.Schema(
  {
    // Tank 1 current level in litres
    tank1: {
      type: Number,
      required: [true, 'Tank 1 level is required'],
      min: [0, 'Tank 1 cannot be negative'],
      max: [14500, 'Tank 1 cannot exceed 14500L'],
    },

    // Tank 2 current level in litres
    tank2: {
      type: Number,
      required: [true, 'Tank 2 level is required'],
      min: [0, 'Tank 2 cannot be negative'],
      max: [5000, 'Tank 2 cannot exceed 5000L'],
    },

    // Average daily fuel sale in litres
    avgSale: {
      type: Number,
      required: [true, 'Average daily sale is required'],
      min: [1, 'Average sale must be at least 1L'],
    },

    // Computed: tank1 + tank2
    totalStock: {
      type: Number,
      required: true,
    },

    // Decision engine output e.g. "14 KL", "No Indent"
    suggestedIndent: {
      type: String,
      required: true,
    },

    // True if any tank is below minimum safe level
    isEmergency: {
      type: Boolean,
      default: false,
    },

    // Human-readable reason for the decision
    reason: {
      type: String,
      default: '',
    },

    // Days of stock remaining at avgSale rate
    daysLeft: {
      type: Number,
      default: 0,
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

module.exports = mongoose.model('StockEntry', StockEntrySchema);
