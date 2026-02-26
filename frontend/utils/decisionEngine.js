// frontend/utils/decisionEngine.js
// Client-side decision engine for live preview on entry form

export const TANK1_CAPACITY = 14500;
export const TANK2_CAPACITY = 5000;
export const TOTAL_CAPACITY = 19500;
export const TANK1_MIN_SAFE = 2000;
export const TANK2_MIN_SAFE = 600;

export const getIndentDecision = (tank1, tank2, avgDailySale) => {
  const totalStock = tank1 + tank2;
  const availableSpace = TOTAL_CAPACITY - totalStock;
  const daysLeft = avgDailySale > 0 ? totalStock / avgDailySale : 0;

  const dayOfWeek = new Date().getDay();
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  // PRIORITY 1: Emergency
  if (tank1 < TANK1_MIN_SAFE || tank2 < TANK2_MIN_SAFE) {
    if (availableSpace >= 14000) {
      return { suggestedIndent: '14 KL (Emergency)', isEmergency: true, reason: `Emergency! Tank${tank1 < TANK1_MIN_SAFE ? ' 1' : ' 2'} below safe level. Order 14 KL immediately.`, daysLeft };
    } else if (availableSpace >= 12000) {
      return { suggestedIndent: '12 KL (Emergency)', isEmergency: true, reason: `Emergency! Tank${tank1 < TANK1_MIN_SAFE ? ' 1' : ' 2'} below safe level. Order 12 KL immediately.`, daysLeft };
    } else {
      const limitedLoad = Math.floor(availableSpace / 1000);
      return { suggestedIndent: `${limitedLoad} KL (Limited Urgent)`, isEmergency: true, reason: `Emergency! Limited space (${availableSpace.toFixed(0)}L). Order max possible.`, daysLeft };
    }
  }

  // PRIORITY 2: Sunday
  if (isSunday) return { suggestedIndent: 'No Indent', isEmergency: false, reason: 'No Indent - Depot Closed on Sunday.', daysLeft };

  // PRIORITY 3: Saturday
  if (isSaturday) {
    if (totalStock < 3000 && availableSpace >= 14000) return { suggestedIndent: '14 KL', isEmergency: false, reason: `Saturday: Low stock. Order 14 KL.`, daysLeft };
    if (totalStock < 6000 && availableSpace >= 12000) return { suggestedIndent: '12 KL', isEmergency: false, reason: `Saturday: Moderate stock. Order 12 KL.`, daysLeft };
    if (availableSpace >= 20000) return { suggestedIndent: '20 KL', isEmergency: false, reason: 'Saturday: Large space. Order 20 KL.', daysLeft };
    return { suggestedIndent: 'No Indent', isEmergency: false, reason: 'Saturday: Stock sufficient.', daysLeft };
  }

  // PRIORITY 4: Weekday
  if (daysLeft < 1.5 && availableSpace >= 14000) return { suggestedIndent: '14 KL', isEmergency: false, reason: `Only ${daysLeft.toFixed(1)} days left. Order 14 KL urgently.`, daysLeft };
  if (daysLeft < 3 && availableSpace >= 12000) return { suggestedIndent: '12 KL', isEmergency: false, reason: `${daysLeft.toFixed(1)} days remaining. Order 12 KL.`, daysLeft };
  return { suggestedIndent: 'No Indent', isEmergency: false, reason: `${daysLeft.toFixed(1)} days stock left. No indent needed.`, daysLeft };
};

export const getTankStatusColor = (level, capacity, minSafe) => {
  const pct = (level / capacity) * 100;
  if (level < minSafe) return '#EF4444';
  if (pct < 30) return '#F97316';
  return '#22C55E';
};

export const getFillPercentage = (level, capacity) =>
  Math.min(Math.max((level / capacity) * 100, 0), 100);
