// backend/utils/decisionEngine.js
const TANK1_CAPACITY  = 14500;
const TANK2_CAPACITY  = 5000;
const TOTAL_CAPACITY  = 19500;
const TANK1_MIN_SAFE  = 2000;
const TANK2_MIN_SAFE  = 600;
const DEPOT_OPEN_HOUR = 8;
const SELLING_HOURS   = 8;
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Sale rates per day — can be customised per deployment
const DAILY_SALE_RATES = { 0:7500, 1:9000, 2:9500, 3:9500, 4:9000, 5:8000, 6:7000 };
const getSaleRate = (idx) => DAILY_SALE_RATES[idx] || 9000;

const toTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return hr + ':' + String(m).padStart(2, '0') + ' ' + ampm;
};

const calcDecant = (tonightStock, klLitres, tmrSaleRate) => {
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

const pickBest = (ts, sr) => {
  const d14 = calcDecant(ts, 14000, sr);
  const d12 = calcDecant(ts, 12000, sr);
  if (d14) return { label: '14 KL', decant: d14 };
  if (d12) return { label: '12 KL', decant: d12 };
  return null;
};

/**
 * @param {number} tank1
 * @param {number} tank2
 * @param {Date}   entryDate  — the night being recorded; decision is for entryDate+1
 */
const getIndentDecision = (tank1, tank2, entryDate) => {
  const ts   = tank1 + tank2;
  const base_date = entryDate instanceof Date ? entryDate : new Date(entryDate || Date.now());

  // Next day after the entry date
  const nextDay    = new Date(base_date.getTime() + 86400000);
  const tmrDayIdx  = nextDay.getDay();
  const tmrName    = DAY_NAMES[tmrDayIdx];
  const tmrSR      = getSaleRate(tmrDayIdx);
  const isSun = tmrDayIdx === 0;
  const isSat = tmrDayIdx === 6;
  const isMon = tmrDayIdx === 1;

  const tmrDL   = tmrSR > 0 ? ts / tmrSR : 0;
  const ratio   = ts > 0 ? tank1 / ts : 0.74;
  const tmrT1   = ts * ratio;
  const tmrT2   = ts * (1 - ratio);

  const d12  = calcDecant(ts, 12000, tmrSR);
  const d14  = calcDecant(ts, 14000, tmrSR);
  const best = pickBest(ts, tmrSR);

  const base = {
    tonightStock: Math.round(ts), tomorrowStock: Math.round(ts),
    tomorrowDay: tmrName, tomorrowSaleRate: tmrSR,
    tmrDaysLeft: parseFloat(tmrDL.toFixed(2)),
    stockAfterTmrDay: Math.max(0, Math.round(ts - tmrSR)),
    decant12: d12, decant14: d14,
  };

  const isEmergency = tmrT1 < TANK1_MIN_SAFE || tmrT2 < TANK2_MIN_SAFE;
  if (isEmergency) {
    const lTank = tmrT1 < TANK1_MIN_SAFE ? 'Tank 1' : 'Tank 2';
    const lLvl  = Math.round(tmrT1 < TANK1_MIN_SAFE ? tmrT1 : tmrT2);
    const safe  = tmrT1 < TANK1_MIN_SAFE ? TANK1_MIN_SAFE : TANK2_MIN_SAFE;
    const lbl   = best ? best.label : 'Max';
    if (isSun) return { ...base, needIndent:true, isEmergency:true, indentDecision:'EMERGENCY', suggestedIndent:lbl+' (Emergency)', urgency:'critical', reason:'🚨 CRITICAL: '+lTank+' ~'+lLvl.toLocaleString()+'L. Sunday depot band — abhi arrange karo!' };
    return { ...base, needIndent:true, isEmergency:true, indentDecision:'EMERGENCY', suggestedIndent:lbl+' (Emergency)', urgency:'critical', reason:'🚨 Emergency! '+lTank+' ~'+lLvl.toLocaleString()+'L (safe:'+safe.toLocaleString()+'L). '+tmrName+' ko '+lbl+' lo.' };
  }
  if (isSun) return { ...base, needIndent:false, isEmergency:false, indentDecision:'NO', suggestedIndent:'No Indent', urgency:'none', reason:'✅ '+tmrName+' — depot band. Stock '+ts.toLocaleString()+'L. Mon ('+getSaleRate(1).toLocaleString()+'L) pe '+(ts/getSaleRate(1)).toFixed(1)+' din.' };
  if (isSat) {
    const need2 = tmrSR + getSaleRate(0);
    if (ts < need2 && best) return { ...base, needIndent:true, isEmergency:false, indentDecision:'YES', suggestedIndent:best.label, urgency:'medium', reason:'📅 '+tmrName+'. Sat+Sun='+need2.toLocaleString()+'L chahiye. Stock '+ts.toLocaleString()+'L. '+best.label+' lo.' };
    return { ...base, needIndent:false, isEmergency:false, indentDecision:'NO', suggestedIndent:'No Indent', urgency:'none', reason:'✅ '+tmrName+'. Stock kaafi — Sat+Sun. Indent nahi.' };
  }
  if (isMon) {
    if (tmrDL < 2 && best) return { ...base, needIndent:true, isEmergency:false, indentDecision:'YES', suggestedIndent:best.label, urgency:'high', reason:'⚠️ '+tmrName+' ('+tmrSR.toLocaleString()+'L/day). Stock '+ts.toLocaleString()+'L = '+tmrDL.toFixed(1)+' din. '+best.label+' ZAROOR lo.' };
    if (tmrDL < 4 && best) return { ...base, needIndent:true, isEmergency:false, indentDecision:'YES', suggestedIndent:best.label, urgency:'medium', reason:'📋 '+tmrName+' ('+tmrSR.toLocaleString()+'L/day). '+tmrDL.toFixed(1)+' din. '+best.label+' lena theek hai.' };
  }
  if (tmrDL < 1.5 && best) return { ...base, needIndent:true, isEmergency:false, indentDecision:'YES', suggestedIndent:best.label, urgency:'high', reason:'⚠️ Bahut kam! '+tmrName+' ('+tmrSR.toLocaleString()+'L/day). '+ts.toLocaleString()+'L = '+tmrDL.toFixed(1)+' din. '+best.label+' ZAROOR lo.' };
  if (tmrDL < 3 && best) return { ...base, needIndent:true, isEmergency:false, indentDecision:'YES', suggestedIndent:best.label, urgency:'medium', reason:'📋 '+tmrName+' ('+tmrSR.toLocaleString()+'L/day). '+ts.toLocaleString()+'L = '+tmrDL.toFixed(1)+' din. '+best.label+' lo.' };
  return { ...base, needIndent:false, isEmergency:false, indentDecision:'NO', suggestedIndent:'No Indent', urgency:'none', reason:'✅ Stock theek. '+tmrName+' ('+tmrSR.toLocaleString()+'L/day) pe '+tmrDL.toFixed(1)+' din. Indent nahi.' };
};

module.exports = { getIndentDecision, calcDecant, getSaleRate, DAILY_SALE_RATES, TANK1_CAPACITY, TANK2_CAPACITY, TOTAL_CAPACITY, TANK1_MIN_SAFE, TANK2_MIN_SAFE };
