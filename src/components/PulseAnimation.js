import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Colors } from '../theme';

export default function PulseAnimation({ isSafe = true, isActive = false }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulseAnim.setValue(0);
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: isActive ? 1000 : 2000,
        useNativeDriver: false, // set to false for border/scale compatibility on Web
      })
    ).start();
  }, [isSafe, isActive]);

  const glowColor = isActive ? Colors.info : (isSafe ? Colors.success : Colors.danger);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5]
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.6, 0.3, 0]
  });

  return (
    <View style={styles.container}>
      {/* Outer Pulse Ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: glowColor,
            transform: [{ scale }],
            opacity: opacity,
            shadowColor: glowColor,
          }
        ]}
      />
      {/* Inner Solid Pulse Core */}
      <View style={[styles.core, { backgroundColor: glowColor, shadowColor: glowColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  ring: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  core: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  }
});
