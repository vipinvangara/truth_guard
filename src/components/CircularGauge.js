import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme';

/**
 * CircularGauge
 * Renders a circular progress ring with a centered score.
 * Uses SVG on web for crisp rendering, falls back to a bordered circle on native.
 *
 * Props:
 *   score      {number}  0–100
 *   size       {number}  diameter in px (default 130)
 *   strokeWidth{number}  ring thickness (default 10)
 *   color      {string}  arc fill color
 *   trackColor {string}  background track color
 *   label      {string}  text below the number
 */
export default function CircularGauge({
  score = 0,
  size = 130,
  strokeWidth = 10,
  color,
  trackColor = Colors.border,
  label = 'Confidence Score',
}) {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Derive color from score if not provided
  const resolvedColor = color || (
    clampedScore >= 65 ? Colors.success :
    clampedScore >= 40 ? Colors.warning :
    Colors.danger
  );

  if (Platform.OS === 'web') {
    // Web: use an inline SVG for a crisp arc
    const r = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    const dashOffset = circumference * (1 - clampedScore / 100);

    return (
      <View style={[styles.wrapper, { width: size, height: size }]}>
        {/* eslint-disable-next-line react-native/no-raw-text */}
        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          {/* Track circle */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={resolvedColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <View style={styles.centerContent}>
          <Text style={[styles.scoreText, { color: resolvedColor }]}>{clampedScore}%</Text>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      </View>
    );
  }

  // Native: simple bold bordered circle
  return (
    <View style={[
      styles.wrapper,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: resolvedColor,
        backgroundColor: Colors.cardBg,
      }
    ]}>
      <View style={styles.centerContent}>
        <Text style={[styles.scoreText, { color: resolvedColor }]}>{clampedScore}%</Text>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  labelText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
});
