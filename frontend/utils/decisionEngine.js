// frontend/utils/decisionEngine.js
// Reads sale rates from AsyncStorage (set by user in Settings)
// Falls back to defaults if not set

import { DEFAULT_RATES, loadRates } from '../screens/SettingsScreen';

export const TANK1_CAPACITY  = 14500;
export const TANK2_CAPACITY  = 5000;
export const TOTAL_CAPACITY  = 19500;
export const TANK1_MIN_SAFE  = 2000;
export const TANK2_MIN_SAFE  = 600;

const DEPOT_OPEN_HOUR = 8;
const SELLING_HOURS   = 8;
export const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Cached rates — refreshed when loadSaleRates() called
let _cachedRates = DEFAULT_RATES;

export const loadSaleRates = async () => {
  _cachedRates = await loadRates();
  return _cachedRates;
};

export const getSaleRate = (dayIndex) =>
  (_cachedRates[dayIndex] || _cachedRates[String(dayIndex)] || DEFAULT_RATES[dayIndex] || 9000);

// Export for display in DailyEntryScreen
export const getActiveRates = () => _cachedRates;

const toTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return hr + ':' + String(m).padStart(2, '0') + ' ' + ampm;
};

export const calcDecant = (tonightStock, klLitres, tmrSaleRate) => {
  const totalAfterLoad = tonightStock + klLitres;
  const overflow       = Math.max(0, totalAfterLoad - TOTAL_CAPACITY);
  const hourlyRate     = tmrSaleRate / SELLING_HOURS;
  if (overflow > tmrSaleRate) return null;
  const minsFromOpen     = hourlyRate > 0 ? Math.round((overflow / hourlyRate) * 60) : 0;
  const decantTime       = toTime(DEPOT_OPEN_HOUR * 60 + minsFromOpen);
  const stockAfterDayEnd = Math.max(0, tonightStock + klLitres - tmrSaleRate);
  const daysLeftAfter    = tmrSaleRate > 0 ? stockAfterDayEnd / tmrSaleRate : 0;
  return {
    klLitres, totalAfterLoad: Math.round(totalAfterLoad),
    overflow: Math.round(overflow), decantTime, minsFromOpen,
    stockAfterDayEnd: Math.round(stockAfterDayEnd),
    daysLeftAfter: parseFloat(daysLeftAfter.toFixed(2)),
  };
};

const pickBest = (tonightStock, tmrSaleRate) => {
  const d14 = calcDecant(tonightStock, 14000, tmrSaleRate);
  const d12 = calcDecant(tonightStock, 12000, tmrSaleRate);
  if (d14) return { label: '14 KL', decant: d14, alt: d12 };
  if (d12) return { label: '12 KL', decant: d12, alt: null };
  return null;
};

export const getIndentDecision = (tank1, tank2) => {
  const tonightStock = tank1 + tank2;

  const tmr         = new Date(); tmr.setDate(tmr.getDate() + 1);
  const tmrDayIdx   = tmr.getDay();
  const tmrName     = DAY_NAMES[tmrDayIdx];
  const tmrSaleRate = getSaleRate(tmrDayIdx);
  const isSun = tmrDayIdx === 0;
  const isSat = tmrDayIdx === 6;
  const isMon = tmrDayIdx === 1;

  const tmrDaysLeft = tmrSaleRate > 0 ? tonightStock / tmrSaleRate : 0;
  const ratio       = tonightStock > 0 ? tank1 / tonightStock : 0.74;
  const tmrTank1    = tonightStock * ratio;
  const tmrTank2    = tonightStock * (1 - ratio);

  const decant12 = calcDecant(tonightStock, 12000, tmrSaleRate);
  const decant14 = calcDecant(tonightStock, 14000, tmrSaleRate);
  const best     = pickBest(tonightStock, tmrSaleRate);

  const base = {
    tonightStock: Math.round(tonightStock),
    tomorrowStock: Math.round(tonightStock),
    tomorrowDay: tmrName,
    tomorrowSaleRate: tmrSaleRate,
    tmrDaysLeft: parseFloat(tmrDaysLeft.toFixed(2)),
    stockAfterTmrDay: Math.max(0, Math.round(tonightStock - tmrSaleRate)),
    decant12, decant14,
  };

  const isEmergency = tmrTank1 < TANK1_MIN_SAFE || tmrTank2 < TANK2_MIN_SAFE;
  if (isEmergency) {
    const lowTank  = tmrTank1 < TANK1_MIN_SAFE ? 'Tank 1' : 'Tank 2';
    const lowLevel = Math.round(tmrTank1 < TANK1_MIN_SAFE ? tmrTank1 : tmrTank2);
    const safe     = tmrTank1 < TANK1_MIN_SAFE ? TANK1_MIN_SAFE : TANK2_MIN_SAFE;
    const lbl      = best ? best.label : 'Max';
    if (isSun) return { ...base, needIndent: true, isEmergency: true, indentDecision: 'EMERGENCY', suggestedIndent: lbl + ' (Emergency)', urgency: 'critical', reason: '🚨 CRITICAL: ' + lowTank + ' ~' + lowLevel.toLocaleString() + 'L hoga. Sunday depot band — abhi emergency supply arrange karo!' };
    return { ...base, needIndent: true, isEmergency: true, indentDecision: 'EMERGENCY', suggestedIndent: lbl + ' (Emergency)', urgency: 'critical', reason: '🚨 Emergency! ' + lowTank + ' sirf ~' + lowLevel.toLocaleString() + 'L (safe: ' + safe.toLocaleString() + 'L). ' + tmrName + ' ko ' + lbl + ' ZAROOR lo.' };
  }

  if (isSun) return { ...base, needIndent: false, isEmergency: false, indentDecision: 'NO', suggestedIndent: 'No Indent', urgency: 'none', reason: '✅ Kal Sunday — depot band. Stock ' + tonightStock.toLocaleString() + 'L. Monday (' + getSaleRate(1).toLocaleString() + 'L/day) pe ' + (tonightStock / getSaleRate(1)).toFixed(1) + ' din.' };

  if (isSat) {
    const need2 = tmrSaleRate + getSaleRate(0);
    if (tonightStock < need2 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'medium', reason: '📅 Kal Saturday. Sat (' + tmrSaleRate.toLocaleString() + ') + Sun (' + getSaleRate(0).toLocaleString() + ') = ' + need2.toLocaleString() + 'L chahiye. Stock ' + tonightStock.toLocaleString() + 'L. ' + best.label + ' lo.' };
    return { ...base, needIndent: false, isEmergency: false, indentDecision: 'NO', suggestedIndent: 'No Indent', urgency: 'none', reason: '✅ Kal Saturday. Stock ' + tonightStock.toLocaleString() + 'L — Sat+Sun kaafi (' + tmrDaysLeft.toFixed(1) + ' din). Indent nahi.' };
  }

  if (isMon) {
    if (tmrDaysLeft < 2 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'high', reason: '⚠️ Kal Monday (' + tmrSaleRate.toLocaleString() + 'L/day). Stock ' + tonightStock.toLocaleString() + 'L = sirf ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' ZAROOR lo.' };
    if (tmrDaysLeft < 4 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'medium', reason: '📋 Kal Monday (' + tmrSaleRate.toLocaleString() + 'L/day). ' + tmrDaysLeft.toFixed(1) + ' din ka stock. ' + best.label + ' lena theek hai.' };
  }

  if (tmrDaysLeft < 1.5 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'high', reason: '⚠️ Bahut kam! ' + tmrName + ' (' + tmrSaleRate.toLocaleString() + 'L/day). Stock ' + tonightStock.toLocaleString() + 'L = ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' ZAROOR lo.' };
  if (tmrDaysLeft < 3 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'medium', reason: '📋 ' + tmrName + ' (' + tmrSaleRate.toLocaleString() + 'L/day). Stock ' + tonightStock.toLocaleString() + 'L = ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' lo.' };

  return { ...base, needIndent: false, isEmergency: false, indentDecision: 'NO', suggestedIndent: 'No Indent', urgency: 'none', reason: '✅ Stock theek. ' + tmrName + ' (' + tmrSaleRate.toLocaleString() + 'L/day) pe ' + tmrDaysLeft.toFixed(1) + ' din. Indent nahi.' };
};

export const getTankStatusColor = (level, capacity, minSafe) => {
  if (level < minSafe) return '#EF4444';
  if ((level / capacity) * 100 < 30) return '#F97316';
  return '#22C55E';
};

export const getFillPercentage = (level, capacity) =>
  Math.min(Math.max((level / capacity) * 100, 0), 100);

/**
 * Same as getIndentDecision but accepts a custom entryDate
 * entryDate = the night whose stock is being entered
 * Decision is for the NEXT day after entryDate
 */
export const getIndentDecisionForDate = (tank1, tank2, entryDate) => {
  const tonightStock = tank1 + tank2;

  // Next day after the entry date
  const nextDay     = new Date(entryDate.getTime() + 86400000);
  const tmrDayIdx   = nextDay.getDay();
  const tmrName     = DAY_NAMES[tmrDayIdx];
  const tmrSaleRate = getSaleRate(tmrDayIdx);
  const isSun = tmrDayIdx === 0;
  const isSat = tmrDayIdx === 6;
  const isMon = tmrDayIdx === 1;

  const tmrDaysLeft = tmrSaleRate > 0 ? tonightStock / tmrSaleRate : 0;
  const ratio       = tonightStock > 0 ? tank1 / tonightStock : 0.74;
  const tmrTank1    = tonightStock * ratio;
  const tmrTank2    = tonightStock * (1 - ratio);

  const decant12 = calcDecant(tonightStock, 12000, tmrSaleRate);
  const decant14 = calcDecant(tonightStock, 14000, tmrSaleRate);
  const best     = pickBestLocal(tonightStock, tmrSaleRate);

  const base = {
    tonightStock: Math.round(tonightStock),
    tomorrowStock: Math.round(tonightStock),
    tomorrowDay: tmrName,
    tomorrowSaleRate: tmrSaleRate,
    tmrDaysLeft: parseFloat(tmrDaysLeft.toFixed(2)),
    stockAfterTmrDay: Math.max(0, Math.round(tonightStock - tmrSaleRate)),
    decant12, decant14,
    entryDate,
    nextDay,
  };

  const isEmergency = tmrTank1 < TANK1_MIN_SAFE || tmrTank2 < TANK2_MIN_SAFE;
  if (isEmergency) {
    const lowTank  = tmrTank1 < TANK1_MIN_SAFE ? 'Tank 1' : 'Tank 2';
    const lowLevel = Math.round(tmrTank1 < TANK1_MIN_SAFE ? tmrTank1 : tmrTank2);
    const safe     = tmrTank1 < TANK1_MIN_SAFE ? TANK1_MIN_SAFE : TANK2_MIN_SAFE;
    const lbl      = best ? best.label : 'Max';
    if (isSun) return { ...base, needIndent: true, isEmergency: true, indentDecision: 'EMERGENCY', suggestedIndent: lbl + ' (Emergency)', urgency: 'critical', reason: '🚨 CRITICAL: ' + lowTank + ' ~' + lowLevel.toLocaleString() + 'L hoga. Sunday depot band — abhi emergency supply arrange karo!' };
    return { ...base, needIndent: true, isEmergency: true, indentDecision: 'EMERGENCY', suggestedIndent: lbl + ' (Emergency)', urgency: 'critical', reason: '🚨 Emergency! ' + lowTank + ' sirf ~' + lowLevel.toLocaleString() + 'L (safe: ' + safe.toLocaleString() + 'L). ' + tmrName + ' ko ' + lbl + ' ZAROOR lo.' };
  }
  if (isSun) return { ...base, needIndent: false, isEmergency: false, indentDecision: 'NO', suggestedIndent: 'No Indent', urgency: 'none', reason: '✅ ' + tmrName + ' — depot band. Stock ' + tonightStock.toLocaleString() + 'L. Monday (' + getSaleRate(1).toLocaleString() + 'L/day) pe ' + (tonightStock/getSaleRate(1)).toFixed(1) + ' din.' };
  if (isSat) {
    const need2 = tmrSaleRate + getSaleRate(0);
    if (tonightStock < need2 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'medium', reason: '📅 ' + tmrName + '. Sat+Sun = ' + need2.toLocaleString() + 'L chahiye. Stock ' + tonightStock.toLocaleString() + 'L. ' + best.label + ' lo.' };
    return { ...base, needIndent: false, isEmergency: false, indentDecision: 'NO', suggestedIndent: 'No Indent', urgency: 'none', reason: '✅ ' + tmrName + '. Stock ' + tonightStock.toLocaleString() + 'L — Sat+Sun kaafi. Indent nahi.' };
  }
  if (isMon) {
    if (tmrDaysLeft < 2 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'high', reason: '⚠️ ' + tmrName + ' (' + tmrSaleRate.toLocaleString() + 'L/day). Stock ' + tonightStock.toLocaleString() + 'L = sirf ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' ZAROOR lo.' };
    if (tmrDaysLeft < 4 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'medium', reason: '📋 ' + tmrName + ' (' + tmrSaleRate.toLocaleString() + 'L/day). ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' lena theek hai.' };
  }
  if (tmrDaysLeft < 1.5 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'high', reason: '⚠️ Bahut kam! ' + tmrName + ' (' + tmrSaleRate.toLocaleString() + 'L/day). Stock ' + tonightStock.toLocaleString() + 'L = ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' ZAROOR lo.' };
  if (tmrDaysLeft < 3 && best) return { ...base, needIndent: true, isEmergency: false, indentDecision: 'YES', suggestedIndent: best.label, urgency: 'medium', reason: '📋 ' + tmrName + ' (' + tmrSaleRate.toLocaleString() + 'L/day). Stock ' + tonightStock.toLocaleString() + 'L = ' + tmrDaysLeft.toFixed(1) + ' din. ' + best.label + ' lo.' };
  return { ...base, needIndent: false, isEmergency: false, indentDecision: 'NO', suggestedIndent: 'No Indent', urgency: 'none', reason: '✅ Stock theek. ' + tmrName + ' (' + tmrSaleRate.toLocaleString() + 'L/day) pe ' + tmrDaysLeft.toFixed(1) + ' din. Indent nahi.' };
};

// Internal helper (same as pickBest but not exported to avoid duplicate)
const pickBestLocal = (tonightStock, tmrSaleRate) => {
  const d14 = calcDecant(tonightStock, 14000, tmrSaleRate);
  const d12 = calcDecant(tonightStock, 12000, tmrSaleRate);
  if (d14) return { label: '14 KL', decant: d14 };
  if (d12) return { label: '12 KL', decant: d12 };
  return null;
};
