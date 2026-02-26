// backend/utils/decisionEngine.js
// ============================================================
// TANK LORRY SMART MANAGER - Decision Engine (Server Side)
// Business logic for determining the suggested fuel indent
// ============================================================

// Tank configuration constants
const TANK1_CAPACITY = 14500; // Litres
const TANK2_CAPACITY = 5000;  // Litres
const TOTAL_CAPACITY = 19500; // Litres

// Minimum safe levels (emergency threshold)
const TANK1_MIN_SAFE = 2000; // Litres
const TANK2_MIN_SAFE = 600;  // Litres

/**
 * Main decision engine function
 * @param {number} tank1 - Current Tank 1 level
 * @param {number} tank2 - Current Tank 2 level
 * @param {number} avgDailySale - Average daily sale in litres
 * @returns {{ suggestedIndent, isEmergency, reason, daysLeft }}
 */
const getIndentDecision = (tank1, tank2, avgDailySale) => {
  const totalStock = tank1 + tank2;
  const availableSpace = TOTAL_CAPACITY - totalStock;
  const daysLeft = avgDailySale > 0 ? totalStock / avgDailySale : 0;

  // Get current day (0 = Sunday, 6 = Saturday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  // ============================================================
  // PRIORITY 1: EMERGENCY CHECK
  // ============================================================
  if (tank1 < TANK1_MIN_SAFE || tank2 < TANK2_MIN_SAFE) {
    if (availableSpace >= 14000) {
      return {
        suggestedIndent: '14 KL (Emergency)',
        isEmergency: true,
        reason: `Emergency! Tank${tank1 < TANK1_MIN_SAFE ? ' 1' : ' 2'} below safe level. Order 14 KL immediately.`,
        daysLeft,
      };
    } else if (availableSpace >= 12000) {
      return {
        suggestedIndent: '12 KL (Emergency)',
        isEmergency: true,
        reason: `Emergency! Tank${tank1 < TANK1_MIN_SAFE ? ' 1' : ' 2'} below safe level. Order 12 KL immediately.`,
        daysLeft,
      };
    } else {
      const limitedLoad = Math.floor(availableSpace / 1000);
      return {
        suggestedIndent: `${limitedLoad} KL (Limited Urgent)`,
        isEmergency: true,
        reason: `Emergency! Low tank but limited space (${availableSpace.toFixed(0)}L). Order max possible.`,
        daysLeft,
      };
    }
  }

  // ============================================================
  // PRIORITY 2: SUNDAY - Depot Closed
  // ============================================================
  if (isSunday) {
    return {
      suggestedIndent: 'No Indent',
      isEmergency: false,
      reason: 'No Indent - Depot Closed on Sunday.',
      daysLeft,
    };
  }

  // ============================================================
  // PRIORITY 3: SATURDAY PLANNING
  // ============================================================
  if (isSaturday) {
    if (totalStock < 3000 && availableSpace >= 14000) {
      return {
        suggestedIndent: '14 KL',
        isEmergency: false,
        reason: `Saturday: Low stock (${totalStock}L). Order 14 KL for weekend coverage.`,
        daysLeft,
      };
    } else if (totalStock < 6000 && availableSpace >= 12000) {
      return {
        suggestedIndent: '12 KL',
        isEmergency: false,
        reason: `Saturday: Moderate stock (${totalStock}L). Order 12 KL for weekend coverage.`,
        daysLeft,
      };
    } else if (availableSpace >= 20000) {
      return {
        suggestedIndent: '20 KL',
        isEmergency: false,
        reason: `Saturday: Large space (${availableSpace}L). Order 20 KL.`,
        daysLeft,
      };
    } else {
      return {
        suggestedIndent: 'No Indent',
        isEmergency: false,
        reason: 'Saturday: Stock sufficient. No indent required.',
        daysLeft,
      };
    }
  }

  // ============================================================
  // PRIORITY 4: WEEKDAY LOGIC
  // ============================================================
  if (daysLeft < 1.5 && availableSpace >= 14000) {
    return {
      suggestedIndent: '14 KL',
      isEmergency: false,
      reason: `Weekday: Only ${daysLeft.toFixed(1)} days left. Order 14 KL urgently.`,
      daysLeft,
    };
  } else if (daysLeft < 3 && availableSpace >= 12000) {
    return {
      suggestedIndent: '12 KL',
      isEmergency: false,
      reason: `Weekday: ${daysLeft.toFixed(1)} days remaining. Order 12 KL.`,
      daysLeft,
    };
  } else {
    return {
      suggestedIndent: 'No Indent',
      isEmergency: false,
      reason: `Weekday: ${daysLeft.toFixed(1)} days stock left. No indent needed.`,
      daysLeft,
    };
  }
};

module.exports = { getIndentDecision, TANK1_CAPACITY, TANK2_CAPACITY, TOTAL_CAPACITY };
