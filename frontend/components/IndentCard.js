// frontend/components/IndentCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const IndentCard = ({ suggestedIndent, isEmergency, reason }) => {
  const isNoIndent = suggestedIndent === 'No Indent';
  const bg = isEmergency ? '#FEF2F2' : isNoIndent ? '#F0FDF4' : '#FFF7ED';
  const border = isEmergency ? '#EF4444' : isNoIndent ? '#22C55E' : '#F97316';
  const textColor = isEmergency ? '#DC2626' : isNoIndent ? '#16A34A' : '#EA580C';
  const icon = isEmergency ? '🚨' : isNoIndent ? '✅' : '🚛';

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>Suggested Indent</Text>
      </View>
      <Text style={[styles.value, { color: textColor }]}>{suggestedIndent}</Text>
      {reason ? <Text style={styles.reason}>{reason}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 2, padding: 16, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  icon: { fontSize: 20 },
  title: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 28, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  reason: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
});

export default IndentCard;
