const mongoose = require('mongoose');

const DecantSchema = new mongoose.Schema({
  klLitres: Number, totalAfterLoad: Number, overflow: Number,
  decantTime: String, minsFromOpen: Number,
  stockAfterDayEnd: Number, daysLeftAfter: Number,
}, { _id: false });

const StockEntrySchema = new mongoose.Schema({
  tank1:           { type: Number, required: true, min: 0, max: 14500 },
  tank2:           { type: Number, required: true, min: 0, max: 5000 },
  avgSale:         { type: Number, default: 0 },  // auto-set from day
  totalStock:      { type: Number, required: true },
  suggestedIndent: { type: String, required: true },
  isEmergency:     { type: Boolean, default: false },
  needIndent:      { type: Boolean, default: false },
  indentDecision:  { type: String, default: 'NO' },
  urgency:         { type: String, default: 'none' },
  reason:          { type: String, default: '' },
  tmrDaysLeft:     { type: Number, default: 0 },
  tomorrowStock:   { type: Number, default: 0 },
  tomorrowDay:     { type: String, default: '' },
  tomorrowSaleRate:{ type: Number, default: 0 },
  decant12:        { type: DecantSchema },
  decant14:        { type: DecantSchema },
}, { timestamps: true });

module.exports = mongoose.model('StockEntry', StockEntrySchema);
