// backend/utils/decisionEngine.js
// ════════════════════════════════════════════════════════════════
// TANK LORRY SMART MANAGER — Decision Engine
//
// SALE RATES (auto-selected by day):
//   Monday    → 9000 L  (week start, high demand)
//   Tuesday   → 9500 L  (peak weekday)
//   Wednesday → 9500 L  (peak weekday)
//   Thursday  → 9000 L
//   Friday    → 8000 L  (pre-weekend slowdown)
//   Saturday  → 7000 L  (weekend)
//   Sunday    → 7500 L  (depot closed — for stock simulation only)
//
// USER FLOW:
//   Raat ko sirf tank levels enter karo
//   → App khud kal ka din pehchanta hai
//   → Sahi sale rate apply karta hai
//   → Batata hai: INDENT LO ya NAHI
//
// DECANT TIME (when indent needed):
//   Overflow = tonight_stock + kl_litres - 19500
//   Hourly rate = tomorrow_sale / 8 selling hours
//   Decant time = 8:00 AM + (overflow / hourly_rate) minutes
// ════════════════════════════════════════════════════════════════

const TANK1_CAPACITY  = 14500;
const TANK2_CAPACITY  = 5000;
const TOTAL_CAPACITY  = 19500;
const TANK1_MIN_SAFE  = 2000;
const TANK2_MIN_SAFE  = 600;
const DEPOT_OPEN_HOUR = 8;
const SELLING_HOURS   = 8;

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ── Sale rates per day of week (index 0=Sun ... 6=Sat) ────────
// Ye values easily change ki ja sakti hain
const DAILY_SALE_RATES = {
  0: 7500,  // Sunday  — depot closed but used for stock simulation
  1: 9000,  // Monday
  2: 9500,  // Tuesday
  3: 9500,  // Wednesday
  4: 9000,  // Thursday
  5: 8000,  // Friday
  6: 7000,  // Saturday
};

/**
 * Get sale rate for a given day index
 */
const getSaleRate = (dayIndex) => DAILY_SALE_RATES[dayIndex] || 9000;

/**
 * Format minutes-from-midnight to "H:MM AM/PM"
 */
const toTime = (totalMinutes) => {
  const h    = Math.floor(totalMinutes / 60) % 24;
  const m    = Math.round(totalMinutes % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr   = h % 12 === 0 ? 12 : h % 12;
  return hr + ':' + String(m).padStart(2, '0') + ' ' + ampm;
};

/**
 * Calculate decant window for a given KL load
 * Returns null if overflow exceeds one day's sale (cannot decant fully)
 */
const calcDecant = (tonightStock, klLitres, tomorrowSaleRate) => {
  const totalAfterLoad = tonightStock + klLitres;
  const overflow       = Math.max(0, totalAfterLoad - TOTAL_CAPACITY);
  const hourlyRate     = tomorrowSaleRate / SELLING_HOURS;

  if (overflow > tomorrowSaleRate) return null; // won't decant in one day

  const minsFromOpen     = hourlyRate > 0
    ? Math.round((overflow / hourlyRate) * 60)
    : 0;
  const decantTime       = toTime(DEPOT_OPEN_HOUR * 60 + minsFromOpen);
  const stockAfterDayEnd = Math.max(0, tonightStock + klLitres - tomorrowSaleRate);

  // Days left AFTER this day ends (use the day-after-tomorrow's sale rate for context)
  const daysLeftAfter    = tomorrowSaleRate > 0 ? stockAfterDayEnd / tomorrowSaleRate : 0;

  return {
    klLitres,
    totalAfterLoad:   Math.round(totalAfterLoad),
    overflow:         Math.round(overflow),
    decantTime,
    minsFromOpen,
    stockAfterDayEnd: Math.round(stockAfterDayEnd),
    daysLeftAfter:    parseFloat(daysLeftAfter.toFixed(2)),
  };
};

/**
 * Pick best feasible KL option: prefer 14, fallback to 12
 */
const pickBest = (tonightStock, tomorrowSaleRate) => {
  const d14 = calcDecant(tonightStock, 14000, tomorrowSaleRate);
  const d12 = calcDecant(tonightStock, 12000, tomorrowSaleRate);
  if (d14) return { label: '14 KL', decant: d14, alt: d12 };
  if (d12) return { label: '12 KL', decant: d12, alt: null };
  return null;
};

// ── Main Engine ───────────────────────────────────────────────

const getIndentDecision = (tank1, tank2) => {
  const tonightStock = tank1 + tank2;

  // ── Tomorrow's day & its sale rate ────────────────────────
  const tmr          = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tmrDayIdx    = tmr.getDay();
  const tmrName      = DAY_NAMES[tmrDayIdx];
  const tmrSaleRate  = getSaleRate(tmrDayIdx);

  const isSun = tmrDayIdx === 0;
  const isSat = tmrDayIdx === 6;
  const isMon = tmrDayIdx === 1;

  // ── Simulate tomorrow morning opening stock ───────────────
  // Tonight's stock minus today's remaining sales
  // We use TONIGHT's day sale rate to estimate what gets sold before tomorrow morning
  const todayDayIdx   = new Date().getDay();
  const todaySaleRate = getSaleRate(todayDayIdx);

  // Conservative: assume rest of today still has full day's worth to go
  // (since user enters at night, most of today's sale already happened)
  // So tomorrow morning ≈ tonight's reading (sales already done today)
  const tomorrowMorningStock = tonightStock; // night reading IS tomorrow's opening

  // After tomorrow's full day of sales
  const stockAfterTmrDay = Math.max(0, tomorrowMorningStock - tmrSaleRate);

  // Days of stock tomorrow morning (using tomorrow's sale rate)
  const tmrDaysLeft = tmrSaleRate > 0 ? tomorrowMorningStock / tmrSaleRate : 0;

  // Per-tank split for emergency check
  const ratio    = tonightStock > 0 ? tank1 / tonightStock : 0.74;
  const tmrTank1 = tomorrowMorningStock * ratio;
  const tmrTank2 = tomorrowMorningStock * (1 - ratio);

  // Decant options using tomorrow's sale rate
  const decant12 = calcDecant(tonightStock, 12000, tmrSaleRate);
  const decant14 = calcDecant(tonightStock, 14000, tmrSaleRate);
  const best     = pickBest(tonightStock, tmrSaleRate);

  // ── Also compute day-after-tomorrow for Saturday planning ─
  const dat          = new Date();
  dat.setDate(dat.getDate() + 2);
  const datDayIdx    = dat.getDay();
  const datSaleRate  = getSaleRate(datDayIdx);
  const datName      = DAY_NAMES[datDayIdx];

  const base = {
    tonightStock:    Math.round(tonightStock),
    tomorrowStock:   Math.round(tomorrowMorningStock),
    tomorrowDay:     tmrName,
    tomorrowSaleRate: tmrSaleRate,
    tmrDaysLeft:     parseFloat(tmrDaysLeft.toFixed(2)),
    stockAfterTmrDay: Math.round(stockAfterTmrDay),
    decant12,
    decant14,
    // Sale rates info for display
    saleRates: DAILY_SALE_RATES,
  };

  // ══ PRIORITY 1: EMERGENCY ══════════════════════════════════
  const isEmergency = tmrTank1 < TANK1_MIN_SAFE || tmrTank2 < TANK2_MIN_SAFE;
  if (isEmergency) {
    const lowTank  = tmrTank1 < TANK1_MIN_SAFE ? 'Tank 1' : 'Tank 2';
    const lowLevel = Math.round(tmrTank1 < TANK1_MIN_SAFE ? tmrTank1 : tmrTank2);
    const safe     = tmrTank1 < TANK1_MIN_SAFE ? TANK1_MIN_SAFE : TANK2_MIN_SAFE;
    const bestLbl  = best ? best.label : 'Max Possible';

    if (isSun) {
      return Object.assign({}, base, {
        needIndent: true, isEmergency: true, indentDecision: 'EMERGENCY',
        suggestedIndent: bestLbl + ' (Emergency)', urgency: 'critical',
        reason: '🚨 CRITICAL: ' + lowTank + ' kal ~' + lowLevel.toLocaleString() +
                'L hoga (safe min: ' + safe.toLocaleString() + 'L). Sunday depot band hai — emergency supply abhi arrange karo!',
      });
    }
    return Object.assign({}, base, {
      needIndent: true, isEmergency: true, indentDecision: 'EMERGENCY',
      suggestedIndent: bestLbl + ' (Emergency)', urgency: 'critical',
      reason: '🚨 Emergency! ' + lowTank + ' kal sirf ~' + lowLevel.toLocaleString() +
              'L hoga — safe level (' + safe.toLocaleString() + 'L) se neeche. ' +
              tmrName + ' ko ZAROOR indent lo. (' + tmrName + ' avg sale: ' + tmrSaleRate.toLocaleString() + 'L)',
    });
  }

  // ══ PRIORITY 2: SUNDAY ═════════════════════════════════════
  if (isSun) {
    return Object.assign({}, base, {
      needIndent: false, isEmergency: false, indentDecision: 'NO',
      suggestedIndent: 'No Indent', urgency: 'none',
      reason: '✅ Kal Sunday hai — depot band. Aaj raat ka stock: ' + tonightStock.toLocaleString() +
              'L. Monday (' + getSaleRate(1).toLocaleString() + 'L/day) ke liye: ' +
              (tonightStock / getSaleRate(1)).toFixed(1) + ' din.',
    });
  }

  // ══ PRIORITY 3: SATURDAY ═══════════════════════════════════
  // Saturday depot open, but Sunday closed — must survive both days
  if (isSat) {
    // Stock needed: Saturday sale + Sunday sale (no delivery Sunday)
    const satSale  = tmrSaleRate;           // 7000
    const sunSale  = getSaleRate(0);         // 7500
    const need2Days = satSale + sunSale;     // 14500

    if (tomorrowMorningStock < need2Days && best) {
      return Object.assign({}, base, {
        needIndent: true, isEmergency: false, indentDecision: 'YES',
        suggestedIndent: best.label, urgency: 'medium',
        reason: '📅 Kal Saturday. Sat (' + satSale.toLocaleString() + 'L) + Sun (' +
                sunSale.toLocaleString() + 'L) = ' + need2Days.toLocaleString() +
                'L chahiye. Stock sirf ' + tonightStock.toLocaleString() + 'L. ' + best.label + ' lo.',
      });
    }
    return Object.assign({}, base, {
      needIndent: false, isEmergency: false, indentDecision: 'NO',
      suggestedIndent: 'No Indent', urgency: 'none',
      reason: '✅ Kal Saturday. Stock ' + tonightStock.toLocaleString() + 'L — Sat+Sun ke liye kaafi (' +
              tmrDaysLeft.toFixed(1) + ' din at ' + satSale.toLocaleString() + 'L/day). Indent nahi.',
    });
  }

  // ══ PRIORITY 4: MONDAY ════════════════════════════════════
  if (isMon) {
    if (tmrDaysLeft < 2 && best) {
      return Object.assign({}, base, {
        needIndent: true, isEmergency: false, indentDecision: 'YES',
        suggestedIndent: best.label, urgency: 'high',
        reason: '⚠️ Kal Monday (week shuru, ' + tmrSaleRate.toLocaleString() +
                'L/day). Stock sirf ' + tonightStock.toLocaleString() +
                'L = ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' ZAROOR lo.',
      });
    }
    if (tmrDaysLeft < 4 && best) {
      return Object.assign({}, base, {
        needIndent: true, isEmergency: false, indentDecision: 'YES',
        suggestedIndent: best.label, urgency: 'medium',
        reason: '📋 Kal Monday (' + tmrSaleRate.toLocaleString() +
                'L/day). ' + tmrDaysLeft.toFixed(1) +
                ' din ka stock. Poori week ke liye ' + best.label + ' lena theek hai.',
      });
    }
  }

  // ══ PRIORITY 5: NORMAL WEEKDAYS (Tue–Fri) ════════════════
  if (tmrDaysLeft < 1.5 && best) {
    return Object.assign({}, base, {
      needIndent: true, isEmergency: false, indentDecision: 'YES',
      suggestedIndent: best.label, urgency: 'high',
      reason: '⚠️ Bahut kam stock! ' + tmrName + ' rate: ' + tmrSaleRate.toLocaleString() +
              'L/day. Stock ' + tonightStock.toLocaleString() +
              'L = sirf ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' ZAROOR lo.',
    });
  }

  if (tmrDaysLeft < 3 && best) {
    return Object.assign({}, base, {
      needIndent: true, isEmergency: false, indentDecision: 'YES',
      suggestedIndent: best.label, urgency: 'medium',
      reason: '📋 Stock thoda kam. ' + tmrName + ' rate: ' + tmrSaleRate.toLocaleString() +
              'L/day. Stock ' + tonightStock.toLocaleString() +
              'L = ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' lo ' + tmrName + ' ko.',
    });
  }

  // ══ ALL GOOD ══════════════════════════════════════════════
  return Object.assign({}, base, {
    needIndent: false, isEmergency: false, indentDecision: 'NO',
    suggestedIndent: 'No Indent', urgency: 'none',
    reason: '✅ Stock acha hai. ' + tmrName + ' rate ' + tmrSaleRate.toLocaleString() +
            'L/day pe ' + tmrDaysLeft.toFixed(1) +
            ' din ka stock. ' + tmrName + ' ko indent nahi chahiye.',
  });
};

module.exports = {
  getIndentDecision,
  calcDecant,
  getSaleRate,
  DAILY_SALE_RATES,
  TANK1_CAPACITY, TANK2_CAPACITY, TOTAL_CAPACITY,
  TANK1_MIN_SAFE, TANK2_MIN_SAFE,
};
