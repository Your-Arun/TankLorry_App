import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import {
  getIndentDecision, loadSaleRates, getSaleRate, DAY_NAMES,
  TANK1_CAPACITY, TANK2_CAPACITY, TANK1_MIN_SAFE, TANK2_MIN_SAFE,
} from '../utils/decisionEngine';
import IndentDecisionCard from '../components/IndentDecisionCard';
import { SafeAreaView } from 'react-native-safe-area-context';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun

const DailyEntryScreen = ({ navigation }) => {
  const { saveEntry, latestEntry } = useApp();
  const [tank1, setTank1] = useState(latestEntry ? String(latestEntry.tank1) : '');
  const [tank2, setTank2] = useState(latestEntry ? String(latestEntry.tank2) : '');
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState({});

  // Tomorrow info
  const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
  const tmrDayIdx = tmr.getDay();
  const tmrName = DAY_NAMES[tmrDayIdx];

  useEffect(() => {
    loadSaleRates().then(setRates);
    // Reload rates whenever screen is focused (in case settings changed)
    const unsub = navigation?.addListener?.('focus', () =>
      loadSaleRates().then(setRates)
    );
    return unsub;
  }, [navigation]);

  const tmrSaleRate = getSaleRate(tmrDayIdx);

  const t1 = parseFloat(tank1) || 0;
  const t2 = parseFloat(tank2) || 0;
  const preview = (t1 > 0 || t2 > 0) ? getIndentDecision(t1, t2) : null;

  const validate = () => {
    if (!tank1 || !tank2) { Alert.alert('Fields missing', 'Dono tank levels bharo.'); return false; }
    if (t1 < 0 || t1 > TANK1_CAPACITY) { Alert.alert('Invalid', 'Tank 1: 0–' + TANK1_CAPACITY + 'L'); return false; }
    if (t2 < 0 || t2 > TANK2_CAPACITY) { Alert.alert('Invalid', 'Tank 2: 0–' + TANK2_CAPACITY + 'L'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = await saveEntry(t1, t2);
    setSaving(false);
    if (result.success) Alert.alert('✅ Saved', 'Entry save ho gai!');
    else Alert.alert('❌ Error', result.error);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>


      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          <Text style={s.title}>Aaj Raat Ki Entry</Text>

          {/* Tomorrow rate info */}
          <View style={s.autoBox}>
            <View style={s.autoBoxTop}>
              <Text style={s.autoBoxIcon}>🗓️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.autoBoxMain}>Kal: {tmrName}</Text>
                <Text style={s.autoBoxSub}>
                  Auto sale rate: <Text style={s.autoBoxRate}>{tmrSaleRate.toLocaleString()} L/day</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={s.editRateBtn}
                onPress={() => navigation?.navigate?.('Settings')}
              >
                <Text style={s.editRateBtnText}>Edit ⚙️</Text>
              </TouchableOpacity>
            </View>

            {/* Mini bar chart */}
            <View style={s.rateRow}>
              {DAY_ORDER.map((idx) => {
                const rate = getSaleRate(idx);
                const maxRate = Math.max(...DAY_ORDER.map(i => getSaleRate(i)));
                const pct = maxRate > 0 ? (rate / maxRate) * 100 : 0;
                const isToday = idx === tmrDayIdx;
                const isWeekend = idx === 0 || idx === 6;
                return (
                  <View key={idx} style={s.miniBar}>
                    <Text style={[s.miniBarVal, isToday && { color: '#FCD34D', fontWeight: '900' }]}>
                      {(rate / 1000).toFixed(1)}K
                    </Text>
                    <View style={s.miniBarTrack}>
                      <View style={[
                        s.miniBarFill,
                        { height: pct + '%', backgroundColor: isToday ? '#FCD34D' : isWeekend ? '#F97316' : '#60A5FA' }
                      ]} />
                    </View>
                    <Text style={[s.miniBarDay, isToday && { color: '#FCD34D', fontWeight: '900' }]}>
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
              <Text style={s.inputHint}>Max {TANK1_CAPACITY.toLocaleString()}L · Safe min {TANK1_MIN_SAFE.toLocaleString()}L</Text>
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
            {t1 > 0 && t1 < TANK1_MIN_SAFE && (
              <Text style={s.warn}>⚠️ Safe level se neeche!</Text>
            )}
          </View>

          {/* Tank 2 */}
          <View style={s.inputCard}>
            <View style={s.inputHeader}>
              <Text style={s.inputLabel}>🛢️ Tank 2</Text>
              <Text style={s.inputHint}>Max {TANK2_CAPACITY.toLocaleString()}L · Safe min {TANK2_MIN_SAFE.toLocaleString()}L</Text>
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
            {t2 > 0 && t2 < TANK2_MIN_SAFE && (
              <Text style={s.warn}>⚠️ Safe level se neeche!</Text>
            )}
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
                <Text style={[s.totalBarVal, { color: '#6EE7B7' }]}>
                  {(19500 - t1 - t2).toLocaleString()} L
                </Text>
              </View>
            </View>
          )}

          {/* Live decision */}
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
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.saveBtnText}>💾 Save Karo</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12, letterSpacing: -0.5 },

  autoBox: { backgroundColor: '#1E3A5F', borderRadius: 14, padding: 14, marginBottom: 16 },
  autoBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  autoBoxIcon: { fontSize: 26 },
  autoBoxMain: { fontSize: 17, fontWeight: '800', color: '#fff' },
  autoBoxSub: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  autoBoxRate: { fontWeight: '900', color: '#FCD34D' },
  editRateBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  editRateBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  rateRow: { flexDirection: 'row', justifyContent: 'space-between', height: 70 },
  miniBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  miniBarVal: { fontSize: 8, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  miniBarTrack: { flex: 1, width: '70%', justifyContent: 'flex-end', maxHeight: 44 },
  miniBarFill: { width: '100%', borderRadius: 3, minHeight: 3 },
  miniBarDay: { fontSize: 9, color: '#64748B', fontWeight: '700', marginTop: 3, textTransform: 'uppercase' },

  inputCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  inputHint: { fontSize: 11, color: '#9CA3AF' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontWeight: '700', color: '#111827', backgroundColor: '#FAFAFA' },
  inputDanger: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  unit: { fontSize: 13, color: '#6B7280', fontWeight: '600', minWidth: 40 },
  warn: { color: '#DC2626', fontSize: 12, marginTop: 8, fontWeight: '600' },

  totalBar: { backgroundColor: '#0F2942', borderRadius: 14, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalBarLabel: { fontSize: 11, color: '#93C5FD', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  totalBarVal: { fontSize: 20, fontWeight: '900', color: '#fff' },

  previewLabel: { fontSize: 12, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },

  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnDisabled: { backgroundColor: '#93C5FD' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});

export default DailyEntryScreen;
