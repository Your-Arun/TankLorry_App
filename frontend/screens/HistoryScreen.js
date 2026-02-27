// frontend/screens/HistoryScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { deleteEntry } from '../api/stockApi';

import { SafeAreaView } from 'react-native-safe-area-context';

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const HistoryItem = ({ item, index, onDeleted }) => {
  const needIndent = item.needIndent;
  const isEmergency = item.isEmergency;
  const color = isEmergency ? '#EF4444' : needIndent ? '#F97316' : '#22C55E';
  const icon  = isEmergency ? '🚨' : needIndent ? '🚛' : '✅';
  const d12   = item.decant12;
  const d14   = item.decant14;

  const handleDelete = () => {
    Alert.alert('Delete?', 'Ye entry delete karo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteEntry(item._id); onDeleted(); }
        catch { Alert.alert('Error', 'Delete fail hua.'); }
      }},
    ]);
  };

  return (
    
    <SafeAreaView style={{ flex: 1 }}>
      
    <View style={[s.card, isEmergency && s.cardEmergency]}>
      {/* Header row */}
      <View style={s.topRow}>
        <View style={s.indexBadge}><Text style={s.indexText}>#{index + 1}</Text></View>
        <Text style={s.dateText}>{formatDate(item.createdAt)}</Text>
        <TouchableOpacity onPress={handleDelete} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16 }}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* YES/NO decision badge — MAIN */}
      <View style={[s.decisionBadge, { backgroundColor: color + '15', borderColor: color }]}>
        <Text style={s.decisionIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.decisionText, { color }]}>
            {isEmergency ? 'EMERGENCY' : needIndent ? 'INDENT LO' : 'INDENT NAHI'}
            {item.suggestedIndent && item.suggestedIndent !== 'No Indent'
              ? '  ·  ' + item.suggestedIndent.replace(' (Emergency)', '') : ''}
          </Text>
          {item.tomorrowDay && (
            <Text style={s.decisionDay}>{item.tomorrowDay} ke liye</Text>
          )}
        </View>
      </View>

      {/* Stock numbers */}
      <View style={s.levels}>
        {[
          ['Tank 1',  item.tank1],
          ['Tank 2',  item.tank2],
          ['Total',   item.totalStock, '#3B82F6'],
          ['Exp Sale',item.avgSale],
        ].map(([label, val, col]) => (
          <View key={label} style={s.levelItem}>
            <Text style={s.levelLabel}>{label}</Text>
            <Text style={[s.levelVal, col && { color: col }]}>{(val||0).toLocaleString()}L</Text>
          </View>
        ))}
      </View>

      {/* Tomorrow stock + days */}
      {item.tomorrowDay && (
        <View style={s.tmrRow}>
          <Text style={s.tmrText}>
            🌅 Kal ({item.tomorrowDay}) ~{(item.tomorrowStock||0).toLocaleString()}L · {(item.tmrDaysLeft||0).toFixed(1)} din
          </Text>
        </View>
      )}

      {/* Decant chips — only if indent needed */}
      {needIndent && (d12 || d14) && (
        <View style={s.decantRow}>
          {d12 && (
            <View style={[s.chip, { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' }]}>
              <Text style={s.chipKL}>12 KL</Text>
              <Text style={[s.chipTime, { color: '#2563EB' }]}>{d12.decantTime}</Text>
              <Text style={s.chipDays}>{d12.daysLeftAfter.toFixed(1)}d after</Text>
            </View>
          )}
          {d14 && (
            <View style={[s.chip, { borderColor: '#C4B5FD', backgroundColor: '#F5F3FF' }]}>
              <Text style={s.chipKL}>14 KL</Text>
              <Text style={[s.chipTime, { color: '#7C3AED' }]}>{d14.decantTime}</Text>
              <Text style={s.chipDays}>{d14.daysLeftAfter.toFixed(1)}d after</Text>
            </View>
          )}
        </View>
      )}
    </View>
    
    </SafeAreaView>
  );
};

const HistoryScreen = () => {
  const { history = [], historyLoading, fetchHistory } = useApp();

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <FlatList
      style={s.container}
      contentContainerStyle={s.content}
       data={history}
      keyExtractor={(item, index) => item?._id || index.toString()}
      renderItem={({ item, index }) => (
        <HistoryItem item={item} index={index} onDeleted={fetchHistory} />
      )}
      refreshControl={<RefreshControl refreshing={historyLoading} onRefresh={fetchHistory} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={s.title}>History</Text>
          <Text style={s.subtitle}>{history.length} entries</Text>
        </View>
      }
      ListEmptyComponent={
        historyLoading ? null : (
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={s.emptyTitle}>Koi entry nahi</Text>
            <Text style={s.emptySub}>Pehle entry save karo.</Text>
          </View>
        )
      }
    />
  );
};

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8FAFC' },
  content:     { padding: 16, paddingBottom: 40 },
  title:       { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle:    { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  cardEmergency: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  topRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  indexBadge:  { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  indexText:   { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
  dateText:    { flex: 1, fontSize: 12, color: '#6B7280', fontWeight: '500' },
  decisionBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, padding: 10, marginBottom: 10, gap: 8 },
  decisionIcon:  { fontSize: 20 },
  decisionText:  { fontSize: 15, fontWeight: '800' },
  decisionDay:   { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  levels:      { flexDirection: 'row', marginBottom: 8 },
  levelItem:   { flex: 1, alignItems: 'center' },
  levelLabel:  { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  levelVal:    { fontSize: 12, fontWeight: '700', color: '#374151' },
  tmrRow:      { backgroundColor: '#F0F4FF', borderRadius: 8, padding: 8, marginBottom: 8 },
  tmrText:     { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  decantRow:   { flexDirection: 'row', gap: 8 },
  chip:        { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 8, alignItems: 'center' },
  chipKL:      { fontSize: 11, fontWeight: '800', color: '#6B7280', marginBottom: 2 },
  chipTime:    { fontSize: 18, fontWeight: '900' },
  chipDays:    { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 12, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: '#9CA3AF' },
});

export default HistoryScreen;
