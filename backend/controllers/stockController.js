const StockEntry = require('../models/StockEntry');
const { getIndentDecision } = require('../utils/decisionEngine');

const createEntry = async (req, res) => {
  try {
    const { tank1, tank2, entryDate } = req.body;
    if (tank1 === undefined || tank2 === undefined)
      return res.status(400).json({ success: false, message: 'tank1 and tank2 required.' });

    const totalStock = Number(tank1) + Number(tank2);

    // Use provided entryDate or now
    const entryDateObj = entryDate ? new Date(entryDate) : new Date();

    const d = getIndentDecision(Number(tank1), Number(tank2), entryDateObj);

    const entry = await StockEntry.create({
      tank1: Number(tank1), tank2: Number(tank2),
      avgSale: d.tomorrowSaleRate,
      totalStock,
      entryDate:        entryDateObj,
      suggestedIndent:  d.suggestedIndent,
      isEmergency:      d.isEmergency,
      needIndent:       d.needIndent,
      indentDecision:   d.indentDecision,
      urgency:          d.urgency,
      reason:           d.reason,
      tmrDaysLeft:      d.tmrDaysLeft,
      tomorrowStock:    d.tomorrowStock,
      tomorrowDay:      d.tomorrowDay,
      tomorrowSaleRate: d.tomorrowSaleRate,
      decant12:         d.decant12,
      decant14:         d.decant14,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getLatestEntry = async (req, res) => {
  try {
    const entry = await StockEntry.findOne().sort({ entryDate: -1, createdAt: -1 });
    if (!entry) return res.status(404).json({ success: false, data: null });
    res.status(200).json({ success: true, data: entry });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const [entries, total] = await Promise.all([
      StockEntry.find().sort({ entryDate: -1, createdAt: -1 }).skip((page-1)*limit).limit(limit),
      StockEntry.countDocuments(),
    ]);
    res.status(200).json({ success: true, total, page, totalPages: Math.ceil(total/limit), data: entries });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const deleteEntry = async (req, res) => {
  try {
    const entry = await StockEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Not found.' });
    res.status(200).json({ success: true, message: 'Deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { createEntry, getLatestEntry, getHistory, deleteEntry };
