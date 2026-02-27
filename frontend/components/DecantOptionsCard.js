// frontend/components/DecantOptionsCard.js
// Shows 12KL and 14KL options side by side with full decant simulation
// Each card shows: overflow, decant time, stock after day, days left after

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const KLCard = ({ kl, option, tonightStock, isRecommended, isEmergency }) => {
  const [expanded, setExpanded] = useState(false);

  if (!option) return null;

  // Color theme per card
  const theme = kl === 14
    ? { primary: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD', light: '#EDE9FE' }
    : { primary: '#2563EB', bg: '#EFF6FF', border: '#93C5FD', light: '#DBEAFE' };

  const badgeColor = isEmergency ? '#EF4444' : option.canFit ? theme.primary : '#6B7280';
  const statusIcon = !option.canFit ? '🚫' : option.overflow === 0 ? '✅' : '🕐';

  return (
    <TouchableOpacity
      style={[
        s.klCard,
        { backgroundColor: option.canFit ? theme.bg : '#F9FAFB', borderColor: option.canFit ? theme.border : '#D1D5DB' },
        isRecommended && option.canFit && s.klCardRecommended,
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      {/* Top badge */}
      {isRecommended && option.canFit && (
        <View style={[s.recommendBadge, { backgroundColor: theme.primary }]}>
          <Text style={s.recommendText}>SUGGESTED</Text>
        </View>
      )}

      {/* KL Header */}
      <View style={s.klHeader}>
        <Text style={[s.klTitle, { color: option.canFit ? theme.primary : '#9CA3AF' }]}>
          {kl} KL
        </Text>
        <Text style={s.klLitres}>{(kl * 1000).toLocaleString()}L</Text>
      </View>

      {/* Total after load */}
      <View style={[s.totalRow, { backgroundColor: option.canFit ? theme.light : '#F3F4F6' }]}>
        <Text style={s.totalLabel}>After Loading</Text>
        <Text style={[s.totalValue, { color: option.canFit ? theme.primary : '#6B7280' }]}>
          {option.totalAfterLoad.toLocaleString()} L
        </Text>
      </View>

      {/* Overflow */}
      <View style={s.row}>
        <Text style={s.rowLabel}>Overflow (excess)</Text>
        <Text style={[s.rowValue, { color: option.overflow > 0 ? '#F97316' : '#22C55E' }]}>
          {option.overflow > 0 ? '+' : ''}{option.overflow.toLocaleString()} L
        </Text>
      </View>

      {/* Decant time — the key info */}
      <View style={[s.decantBox, { borderColor: option.canFit ? theme.border : '#D1D5DB' }]}>
        <Text style={s.decantLabel}>{statusIcon} Decant Time</Text>
        <Text style={[s.decantTime, { color: option.canFit ? badgeColor : '#9CA3AF' }]}>
          {option.canFit ? option.decantTime : 'Not Feasible'}
        </Text>
        {option.canFit && option.overflow > 0 && (
          <Text style={s.decantSub}>
            Sell {option.overflow.toLocaleString()}L first (~{option.decantMinutesFromOpen} min)
          </Text>
        )}
      </View>

      {/* Expandable details */}
      {expanded && option.canFit && (
        <View style={s.expanded}>
          <View style={s.expandRow}>
            <Text style={s.expandLabel}>End of day stock</Text>
            <Text style={s.expandValue}>{option.stockAfterDayEnd.toLocaleString()} L</Text>
          </View>
          <View style={s.expandRow}>
            <Text style={s.expandLabel}>Days left after</Text>
            <Text style={[s.expandValue, {
              color: option.daysLeftAfter < 1.5 ? '#EF4444' : option.daysLeftAfter < 3 ? '#F97316' : '#22C55E'
            }]}>
              {option.daysLeftAfter.toFixed(1)} days
            </Text>
          </View>
        </View>
      )}

      {/* Not feasible message */}
      {!option.canFit && (
        <Text style={s.notFeasible}>
          Overflow ({option.overflow.toLocaleString()}L) &gt; daily sale. Cannot decant fully.
        </Text>
      )}

      <Text style={s.tapHint}>{expanded ? '▲ Less' : '▼ Details'}</Text>
    </TouchableOpacity>
  );
};

const DecantOptionsCard = ({ decision, isEmergency }) => {
  if (!decision || !decision.option12) return null;

  const showOptions = decision.recommendation === 'both' || isEmergency;
  const isNoIndent  = decision.recommendation === 'none';

  // Which option is "recommended"
  const suggested = decision.suggestedIndent || '';
  const rec14 = suggested.includes('14');
  const rec12 = suggested.includes('12') && !rec14;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🚛 Decant Simulation</Text>
        <Text style={s.headerSub}>
          Tonight: {(decision.tonightStock || 0).toLocaleString()}L  ·  Avg sale: {(decision.avgSale || 0).toLocaleString()}L/day
        </Text>
      </View>

      {/* No indent message */}
      {isNoIndent && (
        <View style={s.noIndentBox}>
          <Text style={s.noIndentIcon}>✅</Text>
          <Text style={s.noIndentText}>No indent needed for {decision.tomorrowDay}</Text>
          <Text style={s.noIndentSub}>{decision.reason}</Text>
        </View>
      )}

      {/* Both KL options */}
      {showOptions && (
        <>
          <Text style={s.chooseLabel}>Choose your indent option:</Text>
          <View style={s.optionsRow}>
            <KLCard
              kl={12}
              option={decision.option12}
              tonightStock={decision.tonightStock}
              isRecommended={rec12}
              isEmergency={isEmergency}
            />
            <View style={{ width: 10 }} />
            <KLCard
              kl={14}
              option={decision.option14}
              tonightStock={decision.tonightStock}
              isRecommended={rec14}
              isEmergency={isEmergency}
            />
          </View>
          <Text style={s.tapNote}>Tap a card to see end-of-day stock & days left</Text>
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  header:       { marginBottom: 12 },
  headerTitle:  { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 3 },
  headerSub:    { fontSize: 12, color: '#9CA3AF' },

  noIndentBox:  { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' },
  noIndentIcon: { fontSize: 32, marginBottom: 8 },
  noIndentText: { fontSize: 16, fontWeight: '800', color: '#15803D', marginBottom: 4 },
  noIndentSub:  { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },

  chooseLabel:  { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  optionsRow:   { flexDirection: 'row' },
  tapNote:      { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },

  // KL Card
  klCard:       { flex: 1, borderRadius: 12, borderWidth: 2, padding: 12, position: 'relative' },
  klCardRecommended: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },

  recommendBadge: { position: 'absolute', top: -1, right: -1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderTopRightRadius: 10 },
  recommendText:  { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  klHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  klTitle:      { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  klLitres:     { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  totalRow:     { borderRadius: 8, padding: 8, marginBottom: 8, alignItems: 'center' },
  totalLabel:   { fontSize: 10, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  totalValue:   { fontSize: 16, fontWeight: '800' },

  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowLabel:     { fontSize: 11, color: '#6B7280' },
  rowValue:     { fontSize: 12, fontWeight: '700' },

  decantBox:    { borderWidth: 1.5, borderRadius: 10, padding: 10, marginTop: 4, alignItems: 'center' },
  decantLabel:  { fontSize: 10, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  decantTime:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  decantSub:    { fontSize: 10, color: '#9CA3AF', marginTop: 3, textAlign: 'center' },

  expanded:     { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginTop: 8 },
  expandRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  expandLabel:  { fontSize: 12, color: '#6B7280' },
  expandValue:  { fontSize: 13, fontWeight: '700', color: '#111827' },

  notFeasible:  { fontSize: 11, color: '#EF4444', textAlign: 'center', marginTop: 6, lineHeight: 16 },
  tapHint:      { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
});

export default DecantOptionsCard;
