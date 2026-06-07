import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Shadows } from '../theme';
import { BarChart2, Shield, AlertTriangle, CheckCircle2, RefreshCw, Search } from 'lucide-react-native';

export default function VaultScreen({ verifications, onSelectVerification }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const hasActiveScans = verifications.some(v => v.status === 'scanning');

  const [tasks, setTasks] = useState([
    { id: 1, name: 'Checking C2PA cryptographic certificates', progress: hasActiveScans ? 34 : 100, status: hasActiveScans ? 'running' : 'done' },
    { id: 2, name: 'Querying fact-check databases', progress: hasActiveScans ? 72 : 100, status: hasActiveScans ? 'running' : 'done' },
    { id: 3, name: 'Running audio-visual sync analysis', progress: hasActiveScans ? 95 : 100, status: hasActiveScans ? 'running' : 'done' }
  ]);

  useEffect(() => {
    if (hasActiveScans) {
      setTasks([
        { id: 1, name: 'Checking C2PA cryptographic certificates', progress: 0, status: 'running' },
        { id: 2, name: 'Querying fact-check databases', progress: 0, status: 'running' },
        { id: 3, name: 'Running audio-visual sync analysis', progress: 0, status: 'running' }
      ]);
      const interval = setInterval(() => {
        setTasks(prevTasks => prevTasks.map(t => {
          if (t.progress >= 100) return { ...t, progress: 0, status: 'running' };
          const next = Math.min(100, t.progress + Math.floor(Math.random() * 8) + 2);
          return { ...t, progress: next, status: next === 100 ? 'done' : 'running' };
        }));
      }, 800);
      return () => clearInterval(interval);
    } else {
      const interval = setInterval(() => {
        setTasks(prevTasks => {
          const allDone = prevTasks.every(t => t.progress === 100);
          if (allDone) { clearInterval(interval); return prevTasks.map(t => ({ ...t, status: 'done', progress: 100 })); }
          return prevTasks.map(t => {
            if (t.progress >= 100) return { ...t, progress: 100, status: 'done' };
            const next = Math.min(100, t.progress + Math.floor(Math.random() * 8) + 4);
            return { ...t, progress: next, status: next === 100 ? 'done' : 'running' };
          });
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [hasActiveScans]);

  const filteredVerifications = verifications.filter(item => {
    if (activeFilter === 'THREATS') return item.trustScore < 65;
    if (activeFilter === 'PASSES') return item.trustScore >= 65;
    return true;
  });

  const filters = [
    { key: 'ALL', label: 'All' },
    { key: 'THREATS', label: `Flagged (${verifications.filter(v => v.trustScore < 65).length})` },
    { key: 'PASSES', label: `Passed (${verifications.filter(v => v.trustScore >= 65).length})` },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <View style={styles.headerIconWrap}>
            <BarChart2 color={Colors.primary} size={18} />
          </View>
          <View>
            <Text style={styles.pageTitle}>Scan History</Text>
            <Text style={styles.pageSub}>All your past verification results</Text>
          </View>
        </View>
      </View>

      {/* Background tasks card */}
      <View style={styles.tasksCard}>
        <View style={styles.tasksHeader}>
          <RefreshCw color={Colors.primaryMid} size={14} />
          <Text style={styles.tasksTitle}>Background Analysis Tasks</Text>
        </View>
        <View style={styles.taskList}>
          {tasks.map(t => (
            <View key={t.id} style={styles.taskItem}>
              <View style={styles.taskLabelRow}>
                <Text style={styles.taskName} numberOfLines={1}>{t.name}</Text>
                <Text style={[styles.taskPct, { color: t.status === 'done' ? Colors.success : Colors.primaryMid }]}>
                  {t.progress}%
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, {
                  width: `${t.progress}%`,
                  backgroundColor: t.status === 'done' ? Colors.success : Colors.primaryMid
                }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterTabText, activeFilter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scan list */}
      <Text style={styles.sectionTitle}>Verification Records</Text>

      {filteredVerifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Search color={Colors.textLight} size={28} />
          <Text style={styles.emptyText}>No results in this category</Text>
        </View>
      ) : (
        <View style={styles.scanList}>
          {filteredVerifications.map((item) => {
            const isThreat = item.trustScore < 65;
            const isScanning = item.status === 'scanning';
            const scoreColor = isScanning ? Colors.primaryMid : (isThreat ? Colors.danger : Colors.success);
            const borderColor = isScanning ? Colors.primaryBorder : (isThreat ? Colors.dangerBorder : Colors.successBorder);

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.scanCard, { borderColor }]}
                onPress={() => onSelectVerification(item)}
              >
                <View style={styles.scanCardTop}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.typePill, { backgroundColor: Colors.primaryLight }]}>
                      <Text style={styles.typePillText}>{item.type}</Text>
                    </View>
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                  <Text style={[styles.scoreText, { color: scoreColor }]}>
                    {isScanning ? 'Scanning…' : `${item.trustScore}%`}
                  </Text>
                </View>

                <Text style={styles.scanTitle} numberOfLines={1}>{item.title.replace(/^\[\w+\]\s*/, '')}</Text>
                <Text style={styles.scanSender} numberOfLines={1}>{item.sender}</Text>

                <View style={styles.scanDivider} />

                <View style={styles.scanFooter}>
                  {isScanning ? (
                    <View style={styles.statusRow}>
                      <RefreshCw color={Colors.primaryMid} size={11} />
                      <Text style={[styles.statusLabel, { color: Colors.primaryMid }]}>Scanning…</Text>
                    </View>
                  ) : isThreat ? (
                    <View style={styles.statusRow}>
                      <AlertTriangle color={Colors.danger} size={11} />
                      <Text style={[styles.statusLabel, { color: Colors.danger }]}>Issues detected</Text>
                    </View>
                  ) : (
                    <View style={styles.statusRow}>
                      <CheckCircle2 color={Colors.success} size={11} />
                      <Text style={[styles.statusLabel, { color: Colors.success }]}>Verified</Text>
                    </View>
                  )}
                  <Text style={styles.viewLink}>View →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: 20, paddingBottom: 48 },

  pageHeader: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  pageSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  tasksCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 20, ...Shadows.card,
  },
  tasksHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  tasksTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  taskList: { gap: 14 },
  taskItem: { gap: 6 },
  taskLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskName: { fontSize: 13, color: Colors.textMuted, flex: 1, marginRight: 8 },
  taskPct: { fontSize: 12, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  filterRow: {
    flexDirection: 'row', gap: 8, marginBottom: 20,
    backgroundColor: Colors.cardBgAlt,
    borderRadius: 10, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterTabActive: { backgroundColor: Colors.cardBg, ...Shadows.card },
  filterTabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterTabTextActive: { color: Colors.primary },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },

  emptyCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 40, alignItems: 'center', gap: 12, ...Shadows.card,
  },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  scanList: { gap: 10 },
  scanCard: {
    backgroundColor: Colors.cardBg, borderRadius: 12,
    borderWidth: 1.5, padding: 14, ...Shadows.card,
  },
  scanCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  timeText: { fontSize: 11, color: Colors.textLight },
  scoreText: { fontSize: 14, fontWeight: '800' },
  scanTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  scanSender: { fontSize: 12, color: Colors.textMuted },
  scanDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  scanFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  viewLink: { fontSize: 12, fontWeight: '700', color: Colors.primaryMid },
});
