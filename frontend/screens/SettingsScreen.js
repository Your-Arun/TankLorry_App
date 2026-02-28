// frontend/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY = 'SALE_RATES_V1';

export const DEFAULT_RATES = {
  1: 9000,   // Monday
  2: 9500,   // Tuesday
  3: 9500,   // Wednesday
  4: 9000,   // Thursday
  5: 8000,   // Friday
  6: 7000,   // Saturday
  0: 7500,   // Sunday
};

const DAY_META = [
  { idx: 1, name: 'Monday',    short: 'Mon', emoji: '💼' },
  { idx: 2, name: 'Tuesday',   short: 'Tue', emoji: '💼' },
  { idx: 3, name: 'Wednesday', short: 'Wed', emoji: '💼' },
  { idx: 4, name: 'Thursday',  short: 'Thu', emoji: '💼' },
  { idx: 5, name: 'Friday',    short: 'Fri', emoji: '📉' },
  { idx: 6, name: 'Saturday',  short: 'Sat', emoji: '🌅' },
  { idx: 0, name: 'Sunday',    short: 'Sun', emoji: '🔴' },
];

export const loadRates = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_RATES;
};

export const saveRates = async (rates) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
};

const SettingsScreen = () => {
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [saved, setSaved]  = useState(false);

  useEffect(() => {
    loadRates().then(setRates);
  }, []);

  const updateRate = (idx, val) => {
    const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;
    setRates(prev => ({ ...prev, [idx]: num }));
    setSaved(false);
  };

  const handleSave = async () => {
    // Validate
    for (const { idx, name } of DAY_META) {
      if (!rates[idx] || rates[idx] < 100) {
        Alert.alert('Invalid', name + ' ka rate 100L se kam nahi ho sakta.');
        return;
      }
    }
    await saveRates(rates);
    setSaved(true);
    Alert.alert('✅ Saved', 'Sale rates save ho gaye! Kal se apply honge.');
  };

  const handleReset = () => {
    Alert.alert('Reset?', 'Default rates pe wapas jaoge?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => { setRates(DEFAULT_RATES); setSaved(false); } },
    ]);
  };

  // Bar chart max
  const maxRate = Math.max(...Object.values(rates));

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>⚙️ Sale Rate Settings</Text>
      <Text style={s.subtitle}>
        Har din ka apna expected sale rate set karo.{'\n'}
        App automatically sahi rate use karega.
      </Text>

      {/* Visual bar chart */}
      <View style={s.chartCard}>
        <Text style={s.chartTitle}>Weekly Sale Pattern</Text>
        <View style={s.chart}>
          {DAY_META.map(({ idx, short }) => {
            const pct = maxRate > 0 ? (rates[idx] / maxRate) * 100 : 0;
            const isWeekend = idx === 0 || idx === 6;
            return (
              <View key={idx} style={s.bar}>
                <Text style={s.barVal}>{((rates[idx] || 0)/1000).toFixed(1)}K</Text>
                <View style={s.barTrack}>
                  <View style={[
                    s.barFill,
                    { height: pct + '%', backgroundColor: isWeekend ? '#F97316' : '#3B82F6' }
                  ]} />
                </View>
                <Text style={[s.barDay, isWeekend && { color: '#F97316' }]}>{short}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Input rows */}
      <View style={s.inputsCard}>
        <Text style={s.inputsTitle}>Rates Edit Karo</Text>
        {DAY_META.map(({ idx, name, short, emoji }) => {
          const isWeekend = idx === 0 || idx === 6;
          return (
            <View key={idx} style={[s.row, isWeekend && s.rowWeekend]}>
              <View style={s.rowLeft}>
                <Text style={s.rowEmoji}>{emoji}</Text>
                <View>
                  <Text style={s.rowName}>{name}</Text>
                  {isWeekend && <Text style={s.rowTag}>Weekend</Text>}
                </View>
              </View>
              <View style={s.rowRight}>
                <TextInput
                  style={[s.input, isWeekend && s.inputWeekend]}
                  value={rates[idx] ? String(rates[idx]) : ''}
                  onChangeText={(val) => updateRate(idx, val)}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                />
                <Text style={s.inputUnit}>L/day</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Buttons */}
      <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={s.saveBtnText}>{saved ? '✅ Saved!' : '💾 Save Rates'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.resetBtn} onPress={handleReset} activeOpacity={0.85}>
        <Text style={s.resetBtnText}>↺ Default Reset Karo</Text>
      </TouchableOpacity>

      <View style={s.noteBox}>
        <Text style={s.noteText}>
          💡 <Text style={{ fontWeight: '700' }}>Note:</Text> Sunday ka rate sirf stock simulation ke liye use hota hai (depot band rehta hai Sunday ko).
        </Text>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8FAFC' },
  content:     { padding: 16, paddingBottom: 48 },
  title:       { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 6, letterSpacing: -0.5 },
  subtitle:    { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 20 },

  chartCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  chartTitle:  { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  chart:       { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6 },
  bar:         { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barVal:      { fontSize: 9, color: '#6B7280', fontWeight: '700', marginBottom: 3 },
  barTrack:    { flex: 1, width: '100%', justifyContent: 'flex-end', maxHeight: 72 },
  barFill:     { width: '100%', borderRadius: 4, minHeight: 4 },
  barDay:      { fontSize: 10, color: '#374151', fontWeight: '700', marginTop: 4 },

  inputsCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  inputsTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowWeekend:  { backgroundColor: '#FFFBF5' },
  rowLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowEmoji:    { fontSize: 20 },
  rowName:     { fontSize: 15, fontWeight: '700', color: '#374151' },
  rowTag:      { fontSize: 10, color: '#F97316', fontWeight: '700', textTransform: 'uppercase' },
  rowRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input:       { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 17, fontWeight: '800', color: '#111827', backgroundColor: '#FAFAFA', width: 90, textAlign: 'right' },
  inputWeekend:{ borderColor: '#FED7AA', backgroundColor: '#FFF7ED' },
  inputUnit:   { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

  saveBtn:     { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10, shadowColor: '#3B82F6', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  resetBtn:    { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  resetBtnText:{ color: '#6B7280', fontSize: 15, fontWeight: '700' },

  noteBox:     { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FED7AA' },
  noteText:    { fontSize: 13, color: '#92400E', lineHeight: 19 },
});

export default SettingsScreen;
