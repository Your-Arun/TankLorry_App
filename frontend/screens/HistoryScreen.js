// frontend/screens/HistoryScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import { deleteEntry } from '../api/stockApi';

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const HistoryItem = ({ item, index, onDeleted }) => {
  const isNoIndent = item.suggestedIndent === 'No Indent';
  const color = item.isEmergency ? '#EF4444' : isNoIndent ? '#22C55E' : '#F97316';

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteEntry(item._id);
            onDeleted();
          } catch {
            Alert.alert('Error', 'Failed to delete entry.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.card, item.isEmergency && styles.cardEmergency]}>
      <View style={styles.topRow}>
        <View style={styles.indexBadge}><Text style={styles.indexText}>#{index + 1}</Text></View>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        {item.isEmergency && <Text style={{ fontSize: 16 }}>🚨</Text>}
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.levels}>
        {[['Tank 1', item.tank1], ['Tank 2', item.tank2], ['Total', item.totalStock, '#3B82F6'], ['Avg Sale', item.avgSale]].map(([label, val, col]) => (
          <View key={label} style={styles.levelItem}>
            <Text style={styles.levelLabel}>{label}</Text>
            <Text style={[styles.levelVal, col && { color: col }]}>{val?.toLocaleString()} L</Text>
          </View>
        ))}
      </View>

      <View style={[styles.indentBadge, { backgroundColor: color + '18', borderColor: color }]}>
        <Text style={[styles.indentText, { color }]}>{item.suggestedIndent}</Text>
      </View>

      {item.daysLeft !== undefined && (
        <Text style={styles.daysText}>📅 {Number(item.daysLeft).toFixed(1)} days of stock</Text>
      )}
    </View>
  );
};

const HistoryScreen = () => {
  const { history, historyLoading, fetchHistory } = useApp();

  useEffect(() => { fetchHistory(); }, []);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={(item) => item._id}
      renderItem={({ item, index }) => (
        <HistoryItem item={item} index={index} onDeleted={fetchHistory} />
      )}
      refreshControl={<RefreshControl refreshing={historyLoading} onRefresh={fetchHistory} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{history.length} entries</Text>
        </View>
      }
      ListEmptyComponent={
        historyLoading ? null : (
          <View style={styles.empty}>
            <Text style={{ fontSize: 56 }}>📋</Text>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptySub}>Record daily entries to see them here.</Text>
          </View>
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  cardEmergency: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  indexBadge: { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  indexText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
  dateText: { flex: 1, fontSize: 12, color: '#6B7280', fontWeight: '500' },
  deleteBtn: { padding: 4 },
  deleteText: { fontSize: 16 },
  levels: { flexDirection: 'row', marginBottom: 10 },
  levelItem: { flex: 1, alignItems: 'center' },
  levelLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  levelVal: { fontSize: 13, fontWeight: '700', color: '#374151' },
  indentBadge: { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 6 },
  indentText: { fontSize: 13, fontWeight: '800' },
  daysText: { fontSize: 12, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
});

export default HistoryScreen;
