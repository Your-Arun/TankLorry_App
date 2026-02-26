// frontend/screens/DailyEntryScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { getIndentDecision, TANK1_CAPACITY, TANK2_CAPACITY, TANK1_MIN_SAFE, TANK2_MIN_SAFE } from '../utils/decisionEngine';
import IndentCard from '../components/IndentCard';

const DailyEntryScreen = () => {
  const { saveEntry, latestEntry } = useApp();
  const [tank1, setTank1] = useState(latestEntry ? String(latestEntry.tank1) : '');
  const [tank2, setTank2] = useState(latestEntry ? String(latestEntry.tank2) : '');
  const [avgSale, setAvgSale] = useState(latestEntry ? String(latestEntry.avgSale) : '');
  const [saving, setSaving] = useState(false);

  const t1 = parseFloat(tank1) || 0;
  const t2 = parseFloat(tank2) || 0;
  const avg = parseFloat(avgSale) || 0;
  const preview = (t1 || t2) ? getIndentDecision(t1, t2, avg) : null;

  const validate = () => {
    if (!tank1 || !tank2 || !avgSale) {
      Alert.alert('Missing Fields', 'Please fill in all three fields.'); return false;
    }
    if (t1 < 0 || t1 > TANK1_CAPACITY) {
      Alert.alert('Invalid', `Tank 1 must be 0–${TANK1_CAPACITY}L`); return false;
    }
    if (t2 < 0 || t2 > TANK2_CAPACITY) {
      Alert.alert('Invalid', `Tank 2 must be 0–${TANK2_CAPACITY}L`); return false;
    }
    if (avg <= 0) {
      Alert.alert('Invalid', 'Average sale must be > 0'); return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = await saveEntry(t1, t2, avg);
    setSaving(false);
    if (result.success) {
      Alert.alert('✅ Saved', 'Stock entry saved successfully!');
    } else {
      Alert.alert('❌ Error', `Failed to save: ${result.error}`);
    }
  };

  const InputCard = ({ label, value, onChangeText, max, placeholder, minSafe, warnText }) => {
    const num = parseFloat(value) || 0;
    const isDanger = num > 0 && minSafe && num < minSafe;
    return (
      <View style={styles.card}>
        <View style={styles.inputHeader}>
          <Text style={styles.inputLabel}>{label}</Text>
          {max && <Text style={styles.hint}>Max: {max.toLocaleString()} L</Text>}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, isDanger && styles.inputDanger]}
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            placeholder={placeholder}
            placeholderTextColor="#D1D5DB"
            maxLength={6}
          />
          <Text style={styles.unitLabel}>{max ? 'Litres' : 'L/day'}</Text>
        </View>
        {isDanger && <Text style={styles.warnText}>⚠️ Below safe level ({minSafe?.toLocaleString()} L)</Text>}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Daily Entry</Text>
        <Text style={styles.subtitle}>Record today's tank levels</Text>

        <InputCard label="🛢️ Tank 1 Level" value={tank1} onChangeText={setTank1} max={TANK1_CAPACITY} placeholder={`0 – ${TANK1_CAPACITY.toLocaleString()}`} minSafe={TANK1_MIN_SAFE} />
        <InputCard label="🛢️ Tank 2 Level" value={tank2} onChangeText={setTank2} max={TANK2_CAPACITY} placeholder={`0 – ${TANK2_CAPACITY.toLocaleString()}`} minSafe={TANK2_MIN_SAFE} />
        <InputCard label="📊 Average Daily Sale" value={avgSale} onChangeText={setAvgSale} placeholder="e.g. 2500" />

        {(t1 > 0 || t2 > 0) && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Stock</Text>
            <Text style={styles.totalValue}>{(t1 + t2).toLocaleString()} L</Text>
          </View>
        )}

        {preview && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.previewLabel}>Live Indent Preview</Text>
            <IndentCard suggestedIndent={preview.suggestedIndent} isEmergency={preview.isEmergency} reason={preview.reason} />
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 Save Entry</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: '#374151' },
  hint: { fontSize: 12, color: '#9CA3AF' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '600', color: '#111827', backgroundColor: '#FAFAFA' },
  inputDanger: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  unitLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', minWidth: 44 },
  warnText: { color: '#DC2626', fontSize: 12, marginTop: 8, fontWeight: '600' },
  totalCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#1D4ED8' },
  previewLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveBtnDisabled: { backgroundColor: '#93C5FD' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});

export default DailyEntryScreen;
