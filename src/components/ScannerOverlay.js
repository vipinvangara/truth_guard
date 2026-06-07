import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Colors } from '../theme';

export default function ScannerOverlay() {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const [coords, setCoords] = useState({ x: 124.2, y: 312.4, z: -0.15 });

  useEffect(() => {
    let interval;

    // Sweep scanner line up and down 3 times then stop
    const animation = Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
    ]);

    // Randomize telemetry coordinates slightly to make the system feel alive
    interval = setInterval(() => {
      setCoords({
        x: (120 + Math.random() * 20).toFixed(1),
        y: (300 + Math.random() * 30).toFixed(1),
        z: (-0.1 - Math.random() * 0.2).toFixed(3),
      });
    }, 400);

    animation.start(() => {
      // Settle animation: clear coordinate jitter
      clearInterval(interval);
    });

    return () => {
      clearInterval(interval);
      animation.stop();
    };
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200] // matches container height limits
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Corner Brackets */}
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />

      {/* Grid Pattern Simulation */}
      <View style={styles.gridOverlay} />

      {/* Sweeping Scanner Line */}
      <Animated.View style={[styles.scannerLine, { transform: [{ translateY }] }]}>
        <View style={styles.scannerGlow} />
      </Animated.View>

      {/* Coordinate Telemetry Overlay */}
      <View style={styles.telemetryContainer}>
        <Text style={styles.telemetryText}>MESH LOCK: ACTIVE</Text>
        <Text style={styles.telemetryText}>X: {coords.x}  Y: {coords.y}  Z: {coords.z}</Text>
        <Text style={styles.telemetryText}>DIFFUSION HEURISTIC INDEX: SCROLLING</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: Colors.info,
  },
  topLeft: {
    top: 15,
    left: 15,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 15,
    right: 15,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 15,
    left: 15,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 15,
    right: 15,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    margin: 15,
    borderStyle: 'dashed',
  },
  scannerLine: {
    height: 2,
    backgroundColor: Colors.info,
    position: 'absolute',
    left: 15,
    right: 15,
    top: 15,
    zIndex: 10,
  },
  scannerGlow: {
    height: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
    marginTop: -5,
  },
  telemetryContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(13, 13, 17, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  telemetryText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.info,
    letterSpacing: 0.5,
    lineHeight: 14,
  }
});
