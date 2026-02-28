// frontend/screens/DashboardScreen.js
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useApp } from '../context/AppContext';
import {
  getIndentDecisionForDate,
  loadSaleRates,
  TANK1_CAPACITY, TANK2_CAPACITY, TOTAL_CAPACITY,
  TANK1_MIN_SAFE, TANK2_MIN_SAFE,
} from '../utils/decisionEngine';
import TankGauge          from '../components/TankGauge';
import StatCard           from '../components/StatCard';
import IndentDecisionCard from '../components/IndentDecisionCard';

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
};

const DashboardScreen = ({ navigation }) => {
  const { latestEntry, loading, error, refreshLatest } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSaleRates();   // reload in case settings changed
    await refreshLatest();
    setRefreshing(false);
  };

  // Use saved entryDate from entry — so decision matches what user entered
  // Falls back to new Date() if entryDate not saved (old entries)
  const decision = latestEntry
    ? getIndentDecisionForDate(
        latestEntry.tank1,
        latestEntry.tank2,
        latestEntry.entryDate ? new Date(latestEntry.entryDate) : new Date()
      )
    : null;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={s.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={refreshLatest}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>🛢️ Tank Smart Manager</Text>
        {latestEntry && (
          <Text style={s.headerDate}>
            Entry: {formatDate(latestEntry.entryDate || latestEntry.createdAt)}
          </Text>
        )}
      </View>

      {latestEntry ? (
        <>
          {/* ══ MAIN DECISION ══════════════════════════════ */}
          <IndentDecisionCard decision={decision} />

          {/* ══ TANK LEVELS ════════════════════════════════ */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Tank Levels</Text>
            <View style={s.tanksRow}>
              <TankGauge label="Tank 1" level={latestEntry.tank1}
                capacity={TANK1_CAPACITY} minSafe={TANK1_MIN_SAFE} />
              <View style={s.divider} />
              <TankGauge label="Tank 2" level={latestEntry.tank2}
                capacity={TANK2_CAPACITY} minSafe={TANK2_MIN_SAFE} />
            </View>
          </View>

          {/* ══ QUICK STATS ════════════════════════════════ */}
          <View style={s.row}>
            <StatCard
              label="Aaj Stock"
              value={latestEntry.totalStock.toLocaleString()}
              unit="Litres"
              color="#3B82F6" icon="🌙"
            />
            <View style={{ width: 8 }} />
            <StatCard
              label={decision?.tomorrowDay + ' Stock'}
              value={'~' + (decision?.tomorrowStock ?? 0).toLocaleString()}
              unit="Litres"
              color={
                decision?.tmrDaysLeft < 1.5 ? '#EF4444'
              : decision?.tmrDaysLeft < 3   ? '#F97316'
              : '#22C55E'
              }
              icon="🌅"
            />
            <View style={{ width: 8 }} />
            <StatCard
              label="Sale Rate"
              value={(decision?.tomorrowSaleRate ?? 0).toLocaleString()}
              unit="L/day"
              color="#8B5CF6" icon="📊"
            />
          </View>

          <View style={[s.row, { marginBottom: 4 }]}>
            <StatCard
              label="Available Space"
              value={(TOTAL_CAPACITY - latestEntry.totalStock).toLocaleString()}
              unit="Litres"
              color="#6B7280" icon="🔓"
            />
          </View>
        </>
      ) : (
        <View style={s.empty}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>🛢️</Text>
          <Text style={s.emptyTitle}>Koi data nahi</Text>
          <Text style={s.emptySub}>
            "Daily Entry" tab mein aaj raat ka{'\n'}
            tank level enter karo.{'\n\n'}
            App turant batayega:{'\n'}
            <Text style={{ fontWeight: '700', color: '#3B82F6' }}>
              ✅ Indent chahiye ya nahi
            </Text>
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  content:      { padding: 16, paddingBottom: 40 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', gap: 12 },
  loadingText:  { color: '#6B7280', fontSize: 15 },
  errorText:    { color: '#EF4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:     { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  retryText:    { color: '#fff', fontWeight: '700' },
  header:       { marginBottom: 16 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  headerDate:   { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  tanksRow:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 8 },
  divider:      { width: 1, backgroundColor: '#E5E7EB', alignSelf: 'stretch', marginHorizontal: 12 },
  row:          { flexDirection: 'row', marginBottom: 12 },
  empty:        { alignItems: 'center', paddingVertical: 50 },
  emptyTitle:   { fontSize: 22, fontWeight: '800', color: '#374151', marginBottom: 12, marginTop: 16 },
  emptySub:     { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 26 },
});

export default DashboardScreen;