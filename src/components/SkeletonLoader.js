import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Text } from 'react-native';
import { Colors } from '../theme';
import { RefreshCw } from 'lucide-react-native';

export default function SkeletonLoader({ title = "SCANNING SYSTEM BUFFER..." }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulseAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75]
  });

  return (
    <View style={styles.container}>
      {/* Title Scanner Section */}
      <View style={styles.headerRow}>
        <RefreshCw color={Colors.primary} size={14} style={styles.spinningIcon} />
        <Text style={styles.scanTitle}>{title}</Text>
      </View>

      {/* Pulsing Visual Blocks */}
      <Animated.View style={[styles.pulseContainer, { opacity }]}>
        
        {/* Large Media Placeholder Block */}
        <View style={styles.largeBlock} />

        {/* Text Line Placeholders */}
        <View style={styles.textLineLarge} />
        <View style={styles.textLineMedium} />
        <View style={styles.textLineSmall} />

        {/* Dynamic Detail grid placeholders */}
        <View style={styles.gridRow}>
          <View style={styles.gridBlock} />
          <View style={styles.gridBlock} />
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    minHeight: 350,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  scanTitle: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  pulseContainer: {
    gap: 16,
  },
  largeBlock: {
    height: 140,
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
  textLineLarge: {
    height: 14,
    width: '90%',
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  textLineMedium: {
    height: 14,
    width: '75%',
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  textLineSmall: {
    height: 14,
    width: '50%',
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  gridBlock: {
    flex: 1,
    height: 50,
    backgroundColor: Colors.border,
    borderRadius: 4,
  }
});
