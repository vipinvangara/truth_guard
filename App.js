import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, StatusBar, Alert, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { Colors } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import TruthLogicScreen from './src/screens/TruthLogicScreen';
import MediaInspectorScreen from './src/screens/MediaInspectorScreen';
import VaultScreen from './src/screens/VaultScreen';
import { Shield, User, BookOpen, Video, ShieldAlert, Cpu, Lock, Unlock, Fingerprint, Calendar, Users, FileText, Settings } from 'lucide-react-native';
import { VerificationProvider, useVerificationActions } from './src/context/VerificationContext';

// Globally patch Alert.alert on Web to prevent iframe sandbox/permission errors
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    console.log(`[Alert] ${title}: ${message}`);
    if (buttons && buttons.length > 0) {
      // Find the first button that is not cancel/deny and run its onPress
      const actionButton = buttons.find(b => b.style !== 'cancel' && b.text !== 'DENY') || buttons[0];
      if (actionButton && actionButton.onPress) {
        actionButton.onPress();
      }
    }
  };
}

function MainApp() {
  const {
    activeTab,
    activeItem,
    activeId,
    verifications,
    setActiveTab,
    setActiveId,
    handleIngestStream,
    handlePurgeItem,
    handleUpdateMediaDiagnostics,
    sandboxAuthorized,
    setSandboxAuthorized,
    geminiApiKey,
    setGeminiApiKey
  } = useVerificationActions();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // Remove verification from logs
  const handlePurgeItemLocal = (id) => {
    handlePurgeItem(id);
  };

  const handleSelectVerification = (item) => {
    setActiveId(item.id);
    setActiveTab('VERDICT');
  };

  const handleToggleSandboxAuth = () => {
    if (Platform.OS === 'web') {
      setSandboxAuthorized(prev => {
        const next = !prev;
        if (next) {
          setActiveTab('VERDICT');
        }
        return next;
      });
      return;
    }

    if (!sandboxAuthorized) {
      Alert.alert(
        "AUTHORIZE DATA CONSENSUS",
        "Allow sending metadata signatures to consensus fact-check databases? Raw files and pixel data remain locally sandboxed.",
        [
          { text: "DENY", style: "cancel" },
          { 
            text: "AUTHORIZE", 
            onPress: () => {
              setSandboxAuthorized(true);
              setActiveTab('VERDICT');
              Alert.alert("SHIELD OVERRIDE", "Consensus verification authorized. Local sandboxing intact.");
            }
          }
        ]
      );
    } else {
      setSandboxAuthorized(false);
      Alert.alert("SHIELD LOCKED", "Compute sandboxed. No outbound metadata consensus checks permitted.");
    }
  };

  // Pulse color is safe (green) unless the active item is loaded and has a low trust score (< 65)
  const isEngineSafe = !activeItem || activeItem.trustScore >= 65;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.cardBg} />

      {/* Privacy Sandbox Banner */}
      <View style={[styles.privacyTicker, { backgroundColor: sandboxAuthorized ? Colors.warningBg : Colors.primaryLight }]}>
        <View style={styles.tickerLeft}>
          {sandboxAuthorized ? <Unlock color={Colors.warning} size={11} /> : <Lock color={Colors.primary} size={11} />}
          <Text style={[styles.tickerText, { color: sandboxAuthorized ? Colors.warning : Colors.primary }]}>
            {sandboxAuthorized
              ? 'Consensus mode — metadata signatures may be sent externally'
              : '100% on-device — no data leaves your device'}
          </Text>
        </View>
        <View style={styles.tickerActions}>
          <TouchableOpacity
            style={[styles.tickerBtn, { borderColor: sandboxAuthorized ? Colors.warning : Colors.primary }]}
            onPress={handleToggleSandboxAuth}
          >
            <Text style={[styles.tickerBtnText, { color: sandboxAuthorized ? Colors.warning : Colors.primary }]}>
              {sandboxAuthorized ? 'Restrict' : 'Authorize'}
            </Text>
          </TouchableOpacity>
          {sandboxAuthorized && (
            <TouchableOpacity
              style={styles.settingsIconBtn}
              onPress={() => {
                setTempApiKey(geminiApiKey);
                setShowSettingsModal(true);
              }}
            >
              <Settings color={Colors.warning} size={13} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Consensus API Settings</Text>
            <Text style={styles.modalSub}>
              Enter your Gemini API Key to enable detailed visual scene analysis and character context matching when in Consensus Mode.
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Gemini API Key..."
                placeholderTextColor={Colors.textLight}
                value={tempApiKey}
                onChangeText={setTempApiKey}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.primaryCTA} 
                onPress={() => {
                  setGeminiApiKey(tempApiKey);
                  setShowSettingsModal(false);
                  Alert.alert("API Key Saved", "Your Gemini API Key has been updated locally.");
                }}
              >
                <Text style={styles.primaryCTAText}>Save Key</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {activeTab === 'HOME' && (
          <HomeScreen
            verifications={verifications}
            onSelectVerification={handleSelectVerification}
            onIngestStream={handleIngestStream}
            isEngineSafe={isEngineSafe}
          />
        )}
        {activeTab === 'VERDICT' && (
          <TruthLogicScreen
            item={activeItem}
            onPurgeItem={handlePurgeItemLocal}
          />
        )}
        {activeTab === 'INSPECTOR' && (
          <MediaInspectorScreen
            item={activeItem}
            onUpdateMediaDiagnostics={handleUpdateMediaDiagnostics}
          />
        )}
        {activeTab === 'VAULT' && (
          <VaultScreen
            verifications={verifications}
            onSelectVerification={handleSelectVerification}
          />
        )}
      </View>

      {/* Cyberpunk Navigation Dock */}
      <View style={styles.navBar}>
        <View style={styles.navBarContent}>
          {/* HOME Tab */}
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'HOME' && styles.activeTab]}
            onPress={() => setActiveTab('HOME')}
          >
            <Shield color={activeTab === 'HOME' ? Colors.primary : Colors.textMuted} size={14} />
            <Text style={[styles.navText, { color: activeTab === 'HOME' ? Colors.primary : Colors.textMuted }]}>
              HOME
            </Text>
          </TouchableOpacity>

          {/* VERDICT Tab */}
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'VERDICT' && styles.activeTab]}
            onPress={() => setActiveTab('VERDICT')}
          >
            <BookOpen color={activeTab === 'VERDICT' ? Colors.primary : Colors.textMuted} size={14} />
            <Text style={[styles.navText, { color: activeTab === 'VERDICT' ? Colors.primary : Colors.textMuted }]}>
              VERDICT
            </Text>
            {activeItem && activeItem.trustScore < 65 && (
              <View style={styles.alertDot} />
            )}
          </TouchableOpacity>

          {/* INSPECTOR Tab */}
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'INSPECTOR' && styles.activeTab]}
            onPress={() => setActiveTab('INSPECTOR')}
          >
            <Video color={activeTab === 'INSPECTOR' ? Colors.primary : Colors.textMuted} size={14} />
            <Text style={[styles.navText, { color: activeTab === 'INSPECTOR' ? Colors.primary : Colors.textMuted }]}>
              INSPECTOR
            </Text>
          </TouchableOpacity>

          {/* VAULT Tab */}
          <TouchableOpacity
            style={[styles.navTab, activeTab === 'VAULT' && styles.activeTab]}
            onPress={() => setActiveTab('VAULT')}
          >
            <Cpu color={activeTab === 'VAULT' ? Colors.primary : Colors.textMuted} size={14} />
            <Text style={[styles.navText, { color: activeTab === 'VAULT' ? Colors.primary : Colors.textMuted }]}>
              VAULT
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <VerificationProvider>
      <MainApp />
    </VerificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  privacyTicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  tickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  tickerText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  tickerBtn: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tickerBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
  },
  navBar: {
    height: 58,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 4,
    gap: 0,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    gap: 3,
  },
  activeTab: {
    borderBottomWidth: 2.5,
    borderBottomColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  navText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  alertDot: {
    position: 'absolute',
    top: 8,
    right: '22%',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.cardBg,
  },
  tickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsIconBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 35, 64, 0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    outlineStyle: 'none',
  },
  primaryCTA: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryCTAText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.background,
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modalBtnRow: {
    gap: 8,
  }
});
