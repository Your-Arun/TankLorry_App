import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Modal,
} from 'react-native';
import { useApp } from '../context/AppContext';
import {
  getIndentDecisionForDate, loadSaleRates, getSaleRate, DAY_NAMES,
  TANK1_CAPACITY, TANK2_CAPACITY, TANK1_MIN_SAFE, TANK2_MIN_SAFE,
} from '../utils/decisionEngine';
import IndentDecisionCard from '../components/IndentDecisionCard';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// ── Date Picker Modal ──────────────────────────────────────
const DatePickerModal = ({ visible, selectedDate, onConfirm, onCancel }) => {
  const today = new Date();

  // i = -2 (parso), -1 (kal), 0 (aaj), 1..14 (aage)
  const dates = [];
  for (let i = -2; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({ date: d, offset: i });
  }

  const [picked, setPicked] = useState(selectedDate || today);

  useEffect(() => {
    if (visible) setPicked(selectedDate || today);
  }, [visible]);

  const formatFull = (d) =>
    d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const isSame = (a, b) =>
    a.getDate()  === b.getDate()  &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={dp.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity style={dp.sheet} activeOpacity={1}>
          <View style={dp.handle} />
          <Text style={dp.title}>Kaunsi raat ka stock?</Text>
          <Text style={dp.subtitle}>Uss raat ke agle din ka decision milega</Text>

          {/* Selected preview */}
          <View style={dp.selectedBox}>
            <Text style={dp.selectedLabel}>Selected night →</Text>
            <Text style={dp.selectedDate}>{formatFull(picked)}</Text>
            <View style={dp.arrowRow}>
              <Text style={dp.arrowText}>↓ Decision for</Text>
            </View>
            <Text style={dp.nextDayText}>
              {DAY_NAMES[(new Date(picked.getTime() + 86400000)).getDay()]}
              {' · '}
              {new Date(picked.getTime() + 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </Text>
          </View>

          {/* Date chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={dp.scroll}
            contentContainerStyle={dp.scrollContent}
          >
            {dates.map(({ date: d, offset }) => {
              const isSelected = isSame(d, picked);
              const isToday    = offset === 0;
              const isPast     = offset < 0;   // ✅ properly defined here
              const isWeekend  = d.getDay() === 0 || d.getDay() === 6;

              return (
                <TouchableOpacity
                  key={offset}
                  style={[
                    dp.dateChip,
                    isSelected             && dp.dateChipActive,
                    isPast  && !isSelected && dp.dateChipPast,
                    isWeekend && !isSelected && !isPast && dp.dateChipWeekend,
                  ]}
                  onPress={() => setPicked(d)}
                >
                  <Text style={[dp.chipDay, isSelected && dp.chipDayActive]}>
                    {DAY_NAMES[d.getDay()].slice(0, 3)}
                  </Text>
                  <Text style={[dp.chipDate, isSelected && dp.chipDateActive]}>
                    {d.getDate()}
                  </Text>
                  {isToday  && <Text style={[dp.chipTag, isSelected && { color: '#fff' }]}>Aaj</Text>}
                  {offset === -2 && <Text style={[dp.chipTag, { color: isSelected ? '#fff' : '#EF4444' }]}>Parso</Text>}
                  {offset === -1 && <Text style={[dp.chipTag, { color: isSelected ? '#fff' : '#F97316' }]}>Kal</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Buttons */}
          <View style={dp.btnRow}>
            <TouchableOpacity style={dp.cancelBtn} onPress={onCancel}>
              <Text style={dp.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dp.confirmBtn} onPress={() => onConfirm(picked)}>
              <Text style={dp.confirmText}>Confirm ✓</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ── Main Screen ────────────────────────────────────────────
const DailyEntryScreen = ({ navigation }) => {
  const { saveEntry, latestEntry } = useApp();
  const [tank1,      setTank1]      = useState(latestEntry ? String(latestEntry.tank1) : '');
  const [tank2,      setTank2]      = useState(latestEntry ? String(latestEntry.tank2) : '');
  const [saving,     setSaving]     = useState(false);
  const [rates,      setRates]      = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [entryDate,  setEntryDate]  = useState(new Date());

  // Next day = entryDate + 1
  const nextDay     = new Date(entryDate.getTime() + 86400000);
  const tmrDayIdx   = nextDay.getDay();
  const tmrName     = DAY_NAMES[tmrDayIdx];
  const tmrSaleRate = getSaleRate(tmrDayIdx);

  useEffect(() => {
    loadSaleRates().then(setRates);
    const unsub = navigation?.addListener?.('focus', () => loadSaleRates().then(setRates));
    return unsub;
  }, [navigation]);

  const t1 = parseFloat(tank1) || 0;
  const t2 = parseFloat(tank2) || 0;
  const preview = (t1 > 0 || t2 > 0) ? getIndentDecisionForDate(t1, t2, entryDate) : null;

  const isToday = (() => {
    const now = new Date();
    return entryDate.getDate()     === now.getDate()  &&
           entryDate.getMonth()    === now.getMonth() &&
           entryDate.getFullYear() === now.getFullYear();
  })();

  const entryDateLabel = isToday
    ? 'Aaj (' + entryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ')'
    : entryDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const validate = () => {
    if (!tank1 || !tank2) { Alert.alert('Fields missing', 'Dono tank levels bharo.'); return false; }
    if (t1 < 0 || t1 > TANK1_CAPACITY) { Alert.alert('Invalid', 'Tank 1: 0–' + TANK1_CAPACITY + 'L'); return false; }
    if (t2 < 0 || t2 > TANK2_CAPACITY) { Alert.alert('Invalid', 'Tank 2: 0–' + TANK2_CAPACITY + 'L'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = await saveEntry(t1, t2, entryDate);
    setSaving(false);
    if (result.success) Alert.alert('✅ Saved', 'Entry save ho gai!');
    else Alert.alert('❌ Error', result.error);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <Text style={s.title}>Raat Ka Stock</Text>

        {/* Date selector card */}
        <TouchableOpacity style={s.dateCard} onPress={() => setShowPicker(true)} activeOpacity={0.85}>
          <View style={s.dateLeft}>
            <Text style={s.dateIcon}>📅</Text>
            <View>
              <Text style={s.dateLabel}>Entry ki raat</Text>
              <Text style={s.dateValue}>{entryDateLabel}</Text>
            </View>
          </View>
          <View style={s.dateRight}>
            <Text style={s.dateNextLabel}>→ Decision for</Text>
            <Text style={s.dateNextDay}>{tmrName}</Text>
          </View>
          <Text style={s.dateEditBtn}>Badlo ▼</Text>
        </TouchableOpacity>

        {/* Auto sale rate box */}
        <View style={s.autoBox}>
          <View style={s.autoBoxTop}>
            <Text style={s.autoBoxIcon}>🗓️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.autoBoxMain}>{tmrName} ka rate</Text>
              <Text style={s.autoBoxSub}>
                Auto: <Text style={s.autoBoxRate}>{tmrSaleRate.toLocaleString()} L/day</Text>
              </Text>
            </View>
            <TouchableOpacity style={s.editRateBtn} onPress={() => navigation?.navigate?.('Settings')}>
              <Text style={s.editRateBtnText}>Edit ⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Mini bar chart */}
          <View style={s.rateRow}>
            {DAY_ORDER.map((idx) => {
              const rate      = getSaleRate(idx);
              const maxRate   = Math.max(...DAY_ORDER.map(i => getSaleRate(i)));
              const pct       = maxRate > 0 ? (rate / maxRate) * 100 : 0;
              const isHighlight = idx === tmrDayIdx;
              const isWeekend   = idx === 0 || idx === 6;
              return (
                <View key={idx} style={s.miniBar}>
                  <Text style={[s.miniBarVal, isHighlight && { color: '#FCD34D', fontWeight: '900' }]}>
                    {(rate / 1000).toFixed(1)}K
                  </Text>
                  <View style={s.miniBarTrack}>
                    <View style={[
                      s.miniBarFill,
                      { height: pct + '%', backgroundColor: isHighlight ? '#FCD34D' : isWeekend ? '#F97316' : '#60A5FA' }
                    ]} />
                  </View>
                  <Text style={[s.miniBarDay, isHighlight && { color: '#FCD34D', fontWeight: '900' }]}>
                    {DAY_NAMES[idx].slice(0, 3)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tank 1 */}
        <View style={s.inputCard}>
          <View style={s.inputHeader}>
            <Text style={s.inputLabel}>🛢️ Tank 1</Text>
            <Text style={s.inputHint}>Max {TANK1_CAPACITY.toLocaleString()}L · Safe {TANK1_MIN_SAFE.toLocaleString()}L</Text>
          </View>
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, t1 > 0 && t1 < TANK1_MIN_SAFE && s.inputDanger]}
              value={tank1} onChangeText={setTank1}
              keyboardType="numeric" placeholder="0"
              placeholderTextColor="#D1D5DB" maxLength={6}
            />
            <Text style={s.unit}>Litres</Text>
          </View>
          {t1 > 0 && t1 < TANK1_MIN_SAFE && <Text style={s.warn}>⚠️ Safe level se neeche!</Text>}
        </View>

        {/* Tank 2 */}
        <View style={s.inputCard}>
          <View style={s.inputHeader}>
            <Text style={s.inputLabel}>🛢️ Tank 2</Text>
            <Text style={s.inputHint}>Max {TANK2_CAPACITY.toLocaleString()}L · Safe {TANK2_MIN_SAFE.toLocaleString()}L</Text>
          </View>
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, t2 > 0 && t2 < TANK2_MIN_SAFE && s.inputDanger]}
              value={tank2} onChangeText={setTank2}
              keyboardType="numeric" placeholder="0"
              placeholderTextColor="#D1D5DB" maxLength={5}
            />
            <Text style={s.unit}>Litres</Text>
          </View>
          {t2 > 0 && t2 < TANK2_MIN_SAFE && <Text style={s.warn}>⚠️ Safe level se neeche!</Text>}
        </View>

        {/* Total bar */}
        {(t1 > 0 || t2 > 0) && (
          <View style={s.totalBar}>
            <View>
              <Text style={s.totalBarLabel}>Total Stock</Text>
              <Text style={s.totalBarVal}>{(t1 + t2).toLocaleString()} L</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.totalBarLabel}>Space Bacha</Text>
              <Text style={[s.totalBarVal, { color: '#6EE7B7' }]}>{(19500 - t1 - t2).toLocaleString()} L</Text>
            </View>
          </View>
        )}

        {/* Live decision preview */}
        {preview && (
          <>
            <Text style={s.previewLabel}>📡 Live Preview</Text>
            <IndentDecisionCard decision={preview} />
          </>
        )}

        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave} disabled={saving} activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>💾 Save Karo</Text>}
        </TouchableOpacity>

      </ScrollView>

      <DatePickerModal
        visible={showPicker}
        selectedDate={entryDate}
        onConfirm={(d) => { setEntryDate(d); setShowPicker(false); }}
        onCancel={() => setShowPicker(false)}
      />
    </KeyboardAvoidingView>
  );
};

// ── Main Styles ─────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content:   { padding: 16, paddingBottom: 48 },
  title:     { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12, letterSpacing: -0.5 },

  dateCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#3B82F6', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  dateLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dateIcon:      { fontSize: 26 },
  dateLabel:     { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  dateValue:     { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 2 },
  dateRight:     { alignItems: 'flex-end', marginRight: 10 },
  dateNextLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' },
  dateNextDay:   { fontSize: 16, fontWeight: '900', color: '#3B82F6' },
  dateEditBtn:   { fontSize: 12, color: '#3B82F6', fontWeight: '700' },

  autoBox:        { backgroundColor: '#1E3A5F', borderRadius: 14, padding: 14, marginBottom: 16 },
  autoBoxTop:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  autoBoxIcon:    { fontSize: 26 },
  autoBoxMain:    { fontSize: 17, fontWeight: '800', color: '#fff' },
  autoBoxSub:     { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  autoBoxRate:    { fontWeight: '900', color: '#FCD34D' },
  editRateBtn:    { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  editRateBtnText:{ color: '#fff', fontSize: 12, fontWeight: '700' },
  rateRow:        { flexDirection: 'row', justifyContent: 'space-between', height: 70 },
  miniBar:        { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  miniBarVal:     { fontSize: 8, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  miniBarTrack:   { flex: 1, width: '70%', justifyContent: 'flex-end', maxHeight: 44 },
  miniBarFill:    { width: '100%', borderRadius: 3, minHeight: 3 },
  miniBarDay:     { fontSize: 9, color: '#64748B', fontWeight: '700', marginTop: 3, textTransform: 'uppercase' },

  inputCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  inputHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inputLabel:   { fontSize: 15, fontWeight: '700', color: '#374151' },
  inputHint:    { fontSize: 11, color: '#9CA3AF' },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input:        { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontWeight: '700', color: '#111827', backgroundColor: '#FAFAFA' },
  inputDanger:  { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  unit:         { fontSize: 13, color: '#6B7280', fontWeight: '600', minWidth: 40 },
  warn:         { color: '#DC2626', fontSize: 12, marginTop: 8, fontWeight: '600' },

  totalBar:     { backgroundColor: '#0F2942', borderRadius: 14, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalBarLabel:{ fontSize: 11, color: '#93C5FD', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  totalBarVal:  { fontSize: 20, fontWeight: '900', color: '#fff' },
  previewLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  saveBtn:         { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnDisabled: { backgroundColor: '#93C5FD' },
  saveBtnText:     { color: '#fff', fontSize: 17, fontWeight: '800' },
});

// ── Date Picker Styles ──────────────────────────────────────
const dp = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handle:       { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:        { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 4 },
  subtitle:     { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },

  selectedBox:   { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, marginBottom: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#BFDBFE' },
  selectedLabel: { fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  selectedDate:  { fontSize: 16, fontWeight: '800', color: '#1D4ED8', textAlign: 'center' },
  arrowRow:      { marginVertical: 6 },
  arrowText:     { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  nextDayText:   { fontSize: 22, fontWeight: '900', color: '#3B82F6' },

  scroll:        { marginBottom: 16 },
  scrollContent: { paddingHorizontal: 4, gap: 8 },

  dateChip:        { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', minWidth: 58 },
  dateChipActive:  { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  dateChipPast:    { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },   // laal — 2 din pehle
  dateChipWeekend: { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' },   // orange — weekend

  chipDay:       { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  chipDayActive: { color: '#fff' },
  chipDate:      { fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 2 },
  chipDateActive:{ color: '#fff' },
  chipTag:       { fontSize: 9, fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase', marginTop: 2 },

  btnRow:      { flexDirection: 'row', gap: 12 },
  cancelBtn:   { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText:  { fontSize: 16, fontWeight: '700', color: '#6B7280' },
  confirmBtn:  { flex: 2, backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

export default DailyEntryScreen;