// frontend/components/IndentDecisionCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const IndentDecisionCard = ({ decision }) => {
  if (!decision) return null;

  const { needIndent, isEmergency, suggestedIndent,
          reason, urgency, tomorrowDay, tmrDaysLeft,
          tomorrowStock, tonightStock } = decision;

  const theme = isEmergency
    ? { bg: '#FEF2F2', border: '#EF4444', headerBg: '#EF4444', yesNo: '🚨', label: 'EMERGENCY' }
    : needIndent
    ? urgency === 'high'
      ? { bg: '#FFF7ED', border: '#F97316', headerBg: '#F97316', yesNo: '⚠️', label: 'INDENT LO' }
      : { bg: '#FFFBEB', border: '#F59E0B', headerBg: '#F59E0B', yesNo: '🚛', label: 'INDENT CHAHIYE' }
    : { bg: '#F0FDF4', border: '#22C55E', headerBg: '#22C55E', yesNo: '✅', label: 'INDENT NAHI CHAHIYE' };

  return (
    <View style={[s.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.headerBg }]}>
        <Text style={s.headerEmoji}>{theme.yesNo}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>{theme.label}</Text>
          <Text style={s.headerDay}>{tomorrowDay} ke liye</Text>
        </View>
        {needIndent && suggestedIndent !== 'No Indent' && (
          <View style={s.klBadge}>
            <Text style={s.klBadgeText}>{suggestedIndent?.replace(' (Emergency)', '')}</Text>
          </View>
        )}
      </View>

      {/* Stock summary */}
      <View style={s.stockRow}>
        <View style={s.stockItem}>
          <Text style={s.stockLabel}>Aaj raat stock</Text>
          <Text style={s.stockValue}>{tonightStock?.toLocaleString()} L</Text>
        </View>
        <View style={s.stockDivider} />
        <View style={s.stockItem}>
          <Text style={s.stockLabel}>Kal subah stock</Text>
          <Text style={[s.stockValue, { color: tmrDaysLeft < 1.5 ? '#EF4444' : tmrDaysLeft < 3 ? '#F97316' : '#111827' }]}>
            ~{tomorrowStock?.toLocaleString()} L
          </Text>
        </View>
        <View style={s.stockDivider} />
        <View style={s.stockItem}>
          <Text style={s.stockLabel}>Kal ke din</Text>
          <Text style={[s.stockValue, { color: tmrDaysLeft < 1.5 ? '#EF4444' : tmrDaysLeft < 3 ? '#F97316' : '#22C55E' }]}>
            {tmrDaysLeft?.toFixed(1)} din
          </Text>
        </View>
      </View>

      {/* Reason */}
      <Text style={s.reason}>{reason}</Text>

    </View>
  );
};

const s = StyleSheet.create({
  card:         { borderRadius: 16, borderWidth: 2, overflow: 'hidden', marginBottom: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  headerEmoji:  { fontSize: 28 },
  headerLabel:  { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  headerDay:    { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  klBadge:      { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  klBadgeText:  { color: '#fff', fontSize: 18, fontWeight: '900' },
  stockRow:     { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.04)', paddingVertical: 12 },
  stockItem:    { flex: 1, alignItems: 'center' },
  stockDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  stockLabel:   { fontSize: 10, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' },
  stockValue:   { fontSize: 16, fontWeight: '800', color: '#111827' },
  reason:       { fontSize: 14, color: '#374151', lineHeight: 20, padding: 14 },
});

export default IndentDecisionCard;