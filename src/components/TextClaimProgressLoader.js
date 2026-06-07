import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Colors } from '../theme';
import { Check } from 'lucide-react-native';

const PIPELINE_STAGES = [
  { key: 'SCREENING', label: 'Screening for satire & check-worthiness...' },
  { key: 'CLASSIFICATION', label: 'Classifying claim type...' },
  { key: 'SIGNAL_ANALYSIS', label: 'Running 10-signal analysis...' },
  { key: 'DB_SEARCH', label: 'Searching fact-check databases...' },
  { key: 'NEWS_CROSS_REFERENCE', label: 'Cross-referencing news sources...' },
  { key: 'BIAS_ANALYSIS', label: 'Analyzing emotional & source signals...' },
  { key: 'CALCULATION', label: 'Calculating credibility score...' },
  { key: 'FINALIZATION', label: 'Finalizing results...' }
];

export default function TextClaimProgressLoader({ pipelineStage = 'SCREENING' }) {
  // Determine index of current stage
  const activeIndex = PIPELINE_STAGES.findIndex(s => s.key === pipelineStage);
  const resolvedActiveIndex = activeIndex === -1 ? 0 : activeIndex;

  // Calculate progress percentage
  const progressPct = ((resolvedActiveIndex + 1) / PIPELINE_STAGES.length) * 100;

  return (
    <View style={styles.container}>
      {/* Top Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: Colors.primary }]} />
      </View>

      <View style={styles.checklist}>
        {PIPELINE_STAGES.map((stage, idx) => {
          const isCompleted = idx < resolvedActiveIndex;
          const isActive = idx === resolvedActiveIndex;
          const isPending = idx > resolvedActiveIndex;

          let itemStyle = styles.itemPending;
          let textStyle = styles.textPending;
          let indicator = <View style={styles.pendingDot} />;

          if (isCompleted) {
            itemStyle = styles.itemCompleted;
            textStyle = [styles.textCompleted, { color: Colors.success }];
            indicator = (
              <View style={[styles.completedWrap, { backgroundColor: Colors.successBg }]}>
                <Check color={Colors.success} size={11} strokeWidth={3} />
              </View>
            );
          } else if (isActive) {
            itemStyle = styles.itemActive;
            textStyle = [styles.textActive, { color: Colors.primary }];
            indicator = (
              <View style={[styles.activeDot, { backgroundColor: Colors.primary }]} />
            );
          }

          return (
            <View key={stage.key} style={[styles.row, itemStyle]}>
              <View style={styles.indicatorContainer}>
                {indicator}
              </View>
              <Text style={[styles.label, textStyle]}>
                {stage.label}
              </Text>
              {isActive && (
                <ActivityIndicator size="small" color={Colors.primary} style={styles.spinner} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    minHeight: 320,
    backgroundColor: 'transparent',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  checklist: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  indicatorContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text,
    opacity: 0.3,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completedWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  textPending: {
    color: Colors.text,
    opacity: 0.3,
  },
  textActive: {
    fontWeight: '700',
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  itemPending: {},
  itemActive: {},
  itemCompleted: {},
  spinner: {
    marginLeft: 8,
  }
});
