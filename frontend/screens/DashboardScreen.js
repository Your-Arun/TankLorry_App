// frontend/screens/DashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { getIndentDecision, TANK1_CAPACITY, TANK2_CAPACITY, TOTAL_CAPACITY, TANK1_MIN_SAFE, TANK2_MIN_SAFE } from '../utils/decisionEngine';
import TankGauge from '../components/TankGauge';
import IndentCard from '../components/IndentCard';
import StatCard from '../components/StatCard';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const DashboardScreen = () => {
  const { latestEntry, loading, error, refreshLatest } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLatest();
    setRefreshing(false);
  };

  const decision = latestEntry
    ? getIndentDecision(latestEntry.tank1, latestEntry.tank2, latestEntry.avgSale)
    : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refreshLatest}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛢️ Tank Smart Manager</Text>
        <Text style={styles.headerDate}>
          Updated: {latestEntry ? formatDate(latestEntry.createdAt) : 'No data yet'}
        </Text>
      </View>

      {/* Emergency Banner */}
      {decision?.isEmergency && (
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyText}>🚨 EMERGENCY — IMMEDIATE ACTION REQUIRED</Text>
        </View>
      )}

      {latestEntry ? (
        <>
          {/* Tanks */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tank Levels</Text>
            <View style={styles.tanksRow}>
              <TankGauge label="Tank 1" level={latestEntry.tank1} capacity={TANK1_CAPACITY} minSafe={TANK1_MIN_SAFE} />
              <View style={styles.divider} />
              <TankGauge label="Tank 2" level={latestEntry.tank2} capacity={TANK2_CAPACITY} minSafe={TANK2_MIN_SAFE} />
            </View>
          </View>

          {/* Stats */}
          <View style={styles.row}>
            <StatCard label="Total Stock" value={latestEntry.totalStock.toLocaleString()} unit="Litres" color="#3B82F6" icon="📦" />
            <View style={{ width: 8 }} />
            <StatCard
              label="Days Left"
              value={decision?.daysLeft?.toFixed(1) ?? '—'}
              unit="days"
              color={decision?.daysLeft < 1.5 ? '#EF4444' : decision?.daysLeft < 3 ? '#F97316' : '#22C55E'}
              icon="📅"
            />
            <View style={{ width: 8 }} />
            <StatCard label="Avg Sale" value={latestEntry.avgSale.toLocaleString()} unit="L/day" color="#8B5CF6" icon="📊" />
          </View>

          <View style={[styles.row, { marginBottom: 12 }]}>
            <StatCard
              label="Available Space"
              value={(TOTAL_CAPACITY - latestEntry.totalStock).toLocaleString()}
              unit="Litres"
              color="#6B7280"
              icon="🔓"
            />
          </View>

          {/* Decision */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Today's Decision</Text>
            <IndentCard
              suggestedIndent={decision?.suggestedIndent ?? '—'}
              isEmergency={decision?.isEmergency ?? false}
              reason={decision?.reason ?? ''}
            />
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56 }}>📋</Text>
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptySub}>Go to Daily Entry tab to record today's tank levels.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', gap: 12 },
  loadingText: { color: '#6B7280', fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { backgroundColor: '#3B82F6', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  headerDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  emergencyBanner: { backgroundColor: '#EF4444', borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center' },
  emergencyText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
  tanksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingVertical: 8 },
  divider: { width: 1, backgroundColor: '#E5E7EB', alignSelf: 'stretch', marginHorizontal: 12 },
  row: { flexDirection: 'row', marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
});

export default DashboardScreen;
