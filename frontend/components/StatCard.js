// frontend/components/StatCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatCard = ({ label, value, unit, color = '#1F2937', icon }) => (
  <View style={styles.card}>
    {icon ? <Text style={styles.icon}>{icon}</Text> : null}
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, { color }]}>{value}</Text>
    {unit ? <Text style={styles.unit}>{unit}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, flex: 1, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    elevation: 2, borderWidth: 1, borderColor: '#F3F4F6',
  },
  icon: { fontSize: 22, marginBottom: 4 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  unit: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});

export default StatCard;
