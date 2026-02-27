// frontend/components/IndentDecisionCard.js
// PRIMARY card — clearly shows YES/NO indent decision
// Decant info shown below only when indent IS needed

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const IndentDecisionCard = ({ decision }) => {
  const [showDecant, setShowDecant] = useState(false);
  if (!decision) return null;

  const { needIndent, isEmergency, indentDecision, suggestedIndent,
          reason, urgency, tomorrowDay, tmrDaysLeft, tomorrowStock,
          tonightStock, tomorrowSaleRate, decant12, decant14 } = decision;

  // ── Visual theme based on decision ─────────────────────────
  const theme = isEmergency
    ? { bg: '#FEF2F2', border: '#EF4444', headerBg: '#EF4444', headerText: '#fff',  yesNo: '🚨', yesNoColor: '#fff',  label: 'EMERGENCY' }
    : needIndent
    ? urgency === 'high'
      ? { bg: '#FFF7ED', border: '#F97316', headerBg: '#F97316', headerText: '#fff',  yesNo: '⚠️', yesNoColor: '#fff',  label: 'INDENT LO' }
      : { bg: '#FFFBEB', border: '#F59E0B', headerBg: '#F59E0B', headerText: '#fff',  yesNo: '🚛', yesNoColor: '#fff',  label: 'INDENT CHAHIYE' }
    : { bg: '#F0FDF4', border: '#22C55E', headerBg: '#22C55E', headerText: '#fff',  yesNo: '✅', yesNoColor: '#fff',  label: 'INDENT NAHI CHAHIYE' };

  return (
    <View style={[s.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>

      {/* ── BIG YES / NO HEADER ─────────────────────────── */}
      <View style={[s.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[s.headerEmoji]}>{theme.yesNo}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerLabel, { color: theme.headerText }]}>{theme.label}</Text>
          <Text style={[s.headerDay,   { color: theme.headerText + 'CC' }]}>
            {tomorrowDay} ke liye
          </Text>
        </View>
        {needIndent && suggestedIndent !== 'No Indent' && (
          <View style={s.klBadge}>
            <Text style={s.klBadgeText}>{suggestedIndent?.replace(' (Emergency)', '')}</Text>
          </View>
        )}
      </View>

      {/* ── STOCK SUMMARY ROW ───────────────────────────── */}
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

      {/* ── REASON ──────────────────────────────────────── */}
      <Text style={s.reason}>{reason}</Text>

      {/* ── DECANT INFO (only when indent needed) ───────── */}
      {needIndent && (decant12 || decant14) && (
        <>
          <TouchableOpacity
            style={[s.decantToggle, { borderColor: theme.border }]}
            onPress={() => setShowDecant(!showDecant)}
            activeOpacity={0.8}
          >
            <Text style={[s.decantToggleText, { color: theme.border === '#22C55E' ? '#16A34A' : theme.border }]}>
              🚛 Decant time dekhna hai? {showDecant ? '▲ Band karo' : '▼ Dekho'}
            </Text>
          </TouchableOpacity>

          {showDecant && (
            <View style={s.decantSection}>
              <Text style={s.decantTitle}>Lorry decant timing</Text>
              <Text style={s.decantSubtitle}>
                Expected sale: {tomorrowSaleRate?.toLocaleString()}L/day · Depot opens 8:00 AM
              </Text>

              <View style={s.decantRow}>
                {/* 12 KL card */}
                <View style={[s.decantCard, { borderColor: decant12 ? '#93C5FD' : '#E5E7EB', backgroundColor: decant12 ? '#EFF6FF' : '#F9FAFB' }]}>
                  <Text style={[s.decantKL, { color: decant12 ? '#2563EB' : '#9CA3AF' }]}>12 KL</Text>
                  {decant12 ? (
                    <>
                      <Text style={s.decantTimeLabel}>Decant hogi</Text>
                      <Text style={[s.decantTimeValue, { color: '#2563EB' }]}>{decant12.decantTime}</Text>
                      <View style={s.decantDetail}>
                        <Text style={s.decantDetailText}>Overflow: {decant12.overflow.toLocaleString()}L</Text>
                        <Text style={s.decantDetailText}>End stock: {decant12.stockAfterDayEnd.toLocaleString()}L</Text>
                        <Text style={[s.decantDetailText, { color: decant12.daysLeftAfter < 2 ? '#EF4444' : '#22C55E', fontWeight: '700' }]}>
                          Kal ke baad: {decant12.daysLeftAfter.toFixed(1)} din
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={s.notFeasible}>Space nahi{'\n'}(overflow &gt; daily sale)</Text>
                  )}
                </View>

                <View style={{ width: 10 }} />

                {/* 14 KL card */}
                <View style={[s.decantCard, { borderColor: decant14 ? '#C4B5FD' : '#E5E7EB', backgroundColor: decant14 ? '#F5F3FF' : '#F9FAFB' }]}>
                  <Text style={[s.decantKL, { color: decant14 ? '#7C3AED' : '#9CA3AF' }]}>14 KL</Text>
                  {decant14 ? (
                    <>
                      <Text style={s.decantTimeLabel}>Decant hogi</Text>
                      <Text style={[s.decantTimeValue, { color: '#7C3AED' }]}>{decant14.decantTime}</Text>
                      <View style={s.decantDetail}>
                        <Text style={s.decantDetailText}>Overflow: {decant14.overflow.toLocaleString()}L</Text>
                        <Text style={s.decantDetailText}>End stock: {decant14.stockAfterDayEnd.toLocaleString()}L</Text>
                        <Text style={[s.decantDetailText, { color: decant14.daysLeftAfter < 2 ? '#EF4444' : '#22C55E', fontWeight: '700' }]}>
                          Kal ke baad: {decant14.daysLeftAfter.toFixed(1)} din
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={s.notFeasible}>Space nahi{'\n'}(overflow &gt; daily sale)</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  card:        { borderRadius: 16, borderWidth: 2, overflow: 'hidden', marginBottom: 12 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  headerEmoji: { fontSize: 28 },
  headerLabel: { fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  headerDay:   { fontSize: 13, fontWeight: '600', marginTop: 2 },
  klBadge:     { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  klBadgeText: { color: '#fff', fontSize: 18, fontWeight: '900' },

  // Stock row
  stockRow:     { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.04)', paddingVertical: 12 },
  stockItem:    { flex: 1, alignItems: 'center' },
  stockDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  stockLabel:   { fontSize: 10, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' },
  stockValue:   { fontSize: 16, fontWeight: '800', color: '#111827' },

  // Reason
  reason:       { fontSize: 14, color: '#374151', lineHeight: 20, padding: 14, paddingBottom: 8 },

  // Decant toggle
  decantToggle:     { margin: 14, marginTop: 4, borderRadius: 10, borderWidth: 1.5, padding: 12, alignItems: 'center' },
  decantToggleText: { fontSize: 14, fontWeight: '700' },

  // Decant section
  decantSection: { paddingHorizontal: 14, paddingBottom: 14 },
  decantTitle:   { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 2 },
  decantSubtitle:{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 },
  decantRow:     { flexDirection: 'row' },

  decantCard:    { flex: 1, borderWidth: 2, borderRadius: 12, padding: 12, alignItems: 'center' },
  decantKL:      { fontSize: 22, fontWeight: '900', marginBottom: 6 },
  decantTimeLabel:{ fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  decantTimeValue:{ fontSize: 22, fontWeight: '900', marginBottom: 8 },
  decantDetail:  { width: '100%', gap: 3 },
  decantDetailText:{ fontSize: 11, color: '#6B7280', textAlign: 'center' },
  notFeasible:   { fontSize: 12, color: '#EF4444', textAlign: 'center', marginTop: 8, lineHeight: 18 },
});

export default IndentDecisionCard;
