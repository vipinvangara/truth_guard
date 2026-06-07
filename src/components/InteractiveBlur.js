import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../theme';
import { ShieldAlert, Unlock } from 'lucide-react-native';

export default function InteractiveBlur({ children, shouldBlur = false, onBypass = null }) {
  const [isBypassed, setIsBypassed] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  // Reset bypass status if shouldBlur changes
  useEffect(() => {
    setIsBypassed(false);
  }, [shouldBlur]);

  const handleBypassRequest = () => {
    setAuthenticating(true);
    // Simulate interactive biometric/network authorization check
    setTimeout(() => {
      setAuthenticating(false);
      setIsBypassed(true);
      if (onBypass) onBypass();
    }, 1500);
  };

  if (!shouldBlur || isBypassed) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={styles.container}>
      {/* Target Content (will be blurred or hidden under the overlay) */}
      <View style={styles.blurredContent}>
        {children}
      </View>

      {/* Cyberpunk BakeBlur Security Shield Overlay */}
      <View style={styles.blurOverlay}>
        <View style={styles.warningBox}>
          <ShieldAlert color={Colors.danger} size={38} style={styles.icon} />
          
          <Text style={styles.title}>BAKEBLUR™ ACTIVATED</Text>
          <Text style={styles.subtitle}>AI SYNTHESIS DETECTION &gt; 70%</Text>
          <Text style={styles.description}>
            This asset contains high density generative artifacts. Media obscured to protect system stream.
          </Text>

          {authenticating ? (
            <View style={styles.authContainer}>
              <ActivityIndicator color={Colors.info} size="small" />
              <Text style={styles.authText}>DECRYPTING SIGNATURES...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.bypassButton} 
              onPress={handleBypassRequest}
              activeOpacity={0.8}
            >
              <Unlock color={Colors.info} size={16} />
              <Text style={styles.buttonText}>BYPASS INTEGRITY GUARD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  blurredContent: {
    width: '100%',
    height: '100%',
    opacity: 0.15, // extreme opacity reduction to simulate blur/obscure
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 17, 0.93)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 51, 68, 0.3)',
  },
  warningBox: {
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 320,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    color: Colors.danger,
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.warning,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 153, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  description: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  bypassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.info,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  buttonText: {
    color: Colors.info,
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
  },
  authContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  authText: {
    color: Colors.info,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 1,
  }
});
