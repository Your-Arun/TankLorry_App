// frontend/components/TankGauge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getFillPercentage, getTankStatusColor } from '../utils/decisionEngine';

const TankGauge = ({ label, level, capacity, minSafe }) => {
  const fillPercent = getFillPercentage(level, capacity);
  const color = getTankStatusColor(level, capacity, minSafe);
  const isLow = level < minSafe;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.tankOuter}>
        <View style={[styles.tankFill, { height: `${fillPercent}%`, backgroundColor: color }]} />
        <View style={styles.overlay}>
          <Text style={styles.pct}>{fillPercent.toFixed(0)}%</Text>
        </View>
      </View>
      <Text style={[styles.levelText, { color }]}>{level.toLocaleString()} L</Text>
      <Text style={styles.capText}>/ {capacity.toLocaleString()} L</Text>
      {isLow && (
        <View style={styles.lowBadge}>
          <Text style={styles.lowText}>⚠ LOW</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  tankOuter: {
    width: 60, height: 120, borderWidth: 3, borderColor: '#D1D5DB',
    borderRadius: 8, backgroundColor: '#F3F4F6',
    overflow: 'hidden', justifyContent: 'flex-end', position: 'relative',
  },
  tankFill: { width: '100%', borderRadius: 4 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  pct: { fontSize: 11, fontWeight: '800', color: '#1F2937' },
  levelText: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  capText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  lowBadge: { backgroundColor: '#EF4444', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  lowText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

export default TankGauge;
