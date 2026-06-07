import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Platform, Animated } from 'react-native';
import { Colors, Shadows } from '../theme';
import { Shield, ChevronRight, Video, Image, Mail, Upload, Camera, Share2, Lock, CheckCircle2, AlertTriangle, RefreshCw, Clipboard, Key } from 'lucide-react-native';

// Animated scanning status pill shown while processing
function ScanningPill({ type }) {
  const [stepIdx, setStepIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const getSteps = () => {
    switch (type) {
      case 'Photo':
      case 'Image':
        return ['Scanning C2PA manifest…', 'Evaluating face-mesh noise…', 'Checking SynthID watermark…', 'Analyzing noise distribution…'];
      case 'Video':
        return ['Scanning C2PA manifest…', 'Analyzing audio-visual sync…', 'Evaluating face-mesh noise…', 'Checking lip-sync alignment…'];
      case 'Email':
        return ['Verifying DKIM/SPF headers…', 'Querying fact databases…', 'Analyzing phishing patterns…', 'Checking domain spoofing…'];
      case 'Audio':
        return ['Checking spectrogram authenticity…', 'Scanning speaker consistency…', 'Detecting vocoder artifacts…', 'Querying voice clone databases…'];
      default:
        return ['Checking text structure…', 'Querying fact databases…', 'Evaluating context consistency…', 'Analyzing for phishing patterns…'];
    }
  };

  const steps = getSteps();

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setStepIdx(prev => (prev + 1) % steps.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <View style={styles.scanningPill}>
      <RefreshCw color={Colors.primary} size={11} />
      <Animated.Text style={[styles.scanningPillText, { opacity: fadeAnim }]}>{steps[stepIdx]}</Animated.Text>
    </View>
  );
}

export default function HomeScreen({ verifications, onSelectVerification, onIngestStream, isEngineSafe = true }) {
  const [inputText, setInputText] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [oauthStep, setOauthStep] = useState('idle');
  const [scanningStatus, setScanningStatus] = useState(null);
  const [camStream, setCamStream] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handlePaste = async () => {
    try {
      if (Platform.OS === 'web' && navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          setInputText(clipboardText);
        } else {
          Alert.alert('Clipboard Empty', 'Nothing found on your clipboard.');
        }
      } else {
        Alert.alert('Paste manually', 'Use Ctrl+V or Cmd+V to paste into the text field.');
      }
    } catch (err) {
      Alert.alert('Clipboard blocked', 'Please paste manually using Ctrl+V or Cmd+V.');
    }
  };

  const handleScanText = () => {
    if (!inputText.trim()) {
      Alert.alert('Input required', 'Please enter or paste text to scan.');
      return;
    }
    setScanningStatus('Text');
    const scannedText = inputText;
    setInputText('');
    setShowTextInput(false);
    setTimeout(() => {
      onIngestStream(scannedText, 'Text');
      setScanningStatus(null);
    }, 2500);
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    let type = 'Text';
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.eml')) type = 'Email';
    else if (file.type.startsWith('image/')) type = 'Photo';
    else if (file.type.startsWith('video/')) type = 'Video';
    else if (file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3')) type = 'Audio';
    setScanningStatus(type);
    const reader = new FileReader();
    reader.onload = () => {
      const mediaRef = {
        uri: Platform.OS === 'web' ? URL.createObjectURL(file) : `file:///cache/${file.name}`,
        base64: reader.result,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        contentHash: `hash-${file.name.replace(/[^a-zA-Z0-9]/g, '')}-${file.size}`
      };
      onIngestStream(mediaRef, type, file.name);
      setScanningStatus(null);
    };
    reader.onerror = () => setScanningStatus(null);
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      setTimeout(async () => {
        try {
          if (Platform.OS === 'web' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCamStream(stream);
            if (videoRef.current) videoRef.current.srcObject = stream;
          }
        } catch (e) { console.warn('Camera error:', e); }
      }, 300);
    } catch (err) { console.warn('Camera initialize error:', err); }
  };

  const stopCamera = () => {
    if (camStream) { camStream.getTracks().forEach(track => track.stop()); setCamStream(null); }
    setShowCameraModal(false);
  };

  const handleCaptureFrame = () => {
    let capturedBase64 = null;
    try {
      if (Platform.OS === 'web' && videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height); capturedBase64 = canvas.toDataURL('image/png'); }
      }
    } catch (e) { console.warn('Canvas capture failed:', e); }
    stopCamera();
    setScanningStatus('Photo');
    setTimeout(() => {
      const mediaRef = { uri: 'webcam://frame_captured_0x7f.png', base64: capturedBase64, mimeType: 'image/png', fileSize: 409600, contentHash: 'hash-webcam-snapshot-c2pa-verified-1024' };
      onIngestStream(mediaRef, 'Photo', 'Webcam Snapshot');
      setScanningStatus(null);
    }, 1500);
  };

  const handleSimulateOAuth = (provider) => {
    setOauthStep('connecting');
    setTimeout(() => {
      setOauthStep('completed');
      setTimeout(() => {
        setShowAccountModal(false);
        setOauthStep('idle');
        const mediaRef = { uri: `oauth://${provider.toLowerCase()}/inbox/msg_90412.eml`, mimeType: 'text/plain', fileSize: 2048, contentHash: `hash-oauth-${provider.toLowerCase()}-verified-2048` };
        onIngestStream(mediaRef, 'Email', `${provider} Security Pipeline`);
      }, 1000);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Hidden file input */}
      {Platform.OS === 'web' && (
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange}
          accept="image/*,video/*,audio/*,text/*,.txt,.eml,.wav,.mp3" />
      )}

      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.logoRow}>
          <View style={styles.logoIconWrap}>
            <Shield color={Colors.primary} size={20} />
          </View>
          <Text style={styles.appName}>TruthGuard</Text>
        </View>
        <View style={[styles.engineBadge, { backgroundColor: isEngineSafe ? Colors.successBg : Colors.dangerBg }]}>
          <View style={[styles.engineDot, { backgroundColor: isEngineSafe ? Colors.success : Colors.danger }]} />
          <Text style={[styles.engineBadgeText, { color: isEngineSafe ? Colors.success : Colors.danger }]}>
            {isEngineSafe ? 'Shield Active' : 'Threat Detected'}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.pageTitle}>Verify Content</Text>
      <Text style={styles.pageSubtitle}>Upload a file or image to check for deepfakes and misinformation.</Text>

      {/* Scanning in-progress banner */}
      {scanningStatus !== null && (
        <View style={styles.scanBanner}>
          <ScanningPill type={scanningStatus} />
        </View>
      )}

      {/* Upload Action Cards */}
      <View style={styles.uploadCardList}>

        <TouchableOpacity style={styles.uploadCard} onPress={handleTriggerUpload} id="upload-video-btn">
          <View style={[styles.uploadIconCircle, { backgroundColor: '#E8EDFB' }]}>
            <Video color={Colors.primary} size={22} />
          </View>
          <View style={styles.uploadCardText}>
            <Text style={styles.uploadCardTitle}>Upload Video</Text>
            <Text style={styles.uploadCardSub}>Check for digital manipulation</Text>
          </View>
          <ChevronRight color={Colors.textMuted} size={18} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadCard} onPress={handleTriggerUpload} id="upload-screenshot-btn">
          <View style={[styles.uploadIconCircle, { backgroundColor: '#E6F9F0' }]}>
            <Image color={Colors.success} size={22} />
          </View>
          <View style={styles.uploadCardText}>
            <Text style={styles.uploadCardTitle}>Upload Image</Text>
            <Text style={styles.uploadCardSub}>Verify social media posts</Text>
          </View>
          <ChevronRight color={Colors.textMuted} size={18} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadCard} onPress={() => setShowAccountModal(true)} id="connect-email-btn">
          <View style={[styles.uploadIconCircle, { backgroundColor: '#FFF3E0' }]}>
            <Mail color={Colors.warning} size={22} />
          </View>
          <View style={styles.uploadCardText}>
            <Text style={styles.uploadCardTitle}>Connect Email</Text>
            <Text style={styles.uploadCardSub}>Link Gmail or Outlook via OAuth</Text>
          </View>
          <ChevronRight color={Colors.textMuted} size={18} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadCard} onPress={startCamera} id="camera-btn">
          <View style={[styles.uploadIconCircle, { backgroundColor: '#F3E8FF' }]}>
            <Camera color="#9B59B6" size={22} />
          </View>
          <View style={styles.uploadCardText}>
            <Text style={styles.uploadCardTitle}>Live Camera Scan</Text>
            <Text style={styles.uploadCardSub}>Capture and analyze a frame</Text>
          </View>
          <ChevronRight color={Colors.textMuted} size={18} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadCard} onPress={() => setShowTextInput(!showTextInput)} id="paste-text-btn">
          <View style={[styles.uploadIconCircle, { backgroundColor: '#FEF9E7' }]}>
            <Clipboard color={Colors.warning} size={22} />
          </View>
          <View style={styles.uploadCardText}>
            <Text style={styles.uploadCardTitle}>Paste Text or URL</Text>
            <Text style={styles.uploadCardSub}>Check articles, links, or messages</Text>
          </View>
          <ChevronRight color={Colors.textMuted} size={18} />
        </TouchableOpacity>
      </View>

      {/* Expandable text input */}
      {showTextInput && (
        <View style={styles.textInputCard}>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Paste text, URL, or article content…"
              placeholderTextColor={Colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              id="text-scan-input"
            />
            <TouchableOpacity style={styles.pasteIconBtn} onPress={handlePaste}>
              <Clipboard color={Colors.primary} size={16} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={handleScanText} id="scan-text-btn">
            <Shield color="#fff" size={15} />
            <Text style={styles.scanBtnText}>Run Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Easier Alternative Panel */}
      <View style={styles.alternativePanel}>
        <View style={styles.altIconWrap}>
          <View style={styles.altIconOuter}>
            <View style={styles.altIconBadge}>
              <CheckCircle2 color="#fff" size={10} />
            </View>
            <Share2 color={Colors.text} size={22} />
          </View>
        </View>
        <Text style={styles.altTitle}>Easier Alternative</Text>
        <Text style={styles.altDesc}>
          You can also share directly from WhatsApp or YouTube to TruthGuard to begin a scan automatically.
        </Text>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Lock color={Colors.textLight} size={13} />
        <Text style={styles.privacyText}>We don't store your videos permanently.</Text>
      </View>

      {/* --- Recent Scans Log --- */}
      {verifications.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <View style={styles.logList}>
            {verifications.map((item) => {
              const isHighTrust = item.trustScore >= 65;
              const isScanning = item.status === 'scanning' || item.status === 'queued';
              const scoreColor = isHighTrust ? Colors.success : Colors.danger;
              const scoreBg = isHighTrust ? Colors.successBg : Colors.dangerBg;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.logCard, isScanning && styles.logCardScanning]}
                  onPress={() => onSelectVerification(item)}
                >
                  <View style={styles.logCardLeft}>
                    <View style={[styles.logTypeBadge, { backgroundColor: Colors.primaryLight }]}>
                      <Text style={styles.logTypeBadgeText}>{item.type}</Text>
                    </View>
                    <View style={styles.logCardInfo}>
                      <Text style={styles.logCardTitle} numberOfLines={1}>{item.title.replace(/^\[\w+\]\s*/, '')}</Text>
                      <Text style={styles.logCardSub} numberOfLines={1}>{item.sender}</Text>
                    </View>
                  </View>
                  <View style={styles.logCardRight}>
                    {isScanning ? (
                      <ScanningPill type={item.type} />
                    ) : (
                      <View style={[styles.scorePill, { backgroundColor: scoreBg }]}>
                        {isHighTrust
                          ? <CheckCircle2 color={scoreColor} size={11} />
                          : <AlertTriangle color={scoreColor} size={11} />}
                        <Text style={[styles.scorePillText, { color: scoreColor }]}>
                          {item.trustScore}%
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* OAuth Modal */}
      <Modal visible={showAccountModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Connect Account</Text>
            <Text style={styles.modalSub}>Link your email to scan incoming messages automatically.</Text>
            {oauthStep === 'idle' ? (
              <View style={styles.oauthStack}>
                <TouchableOpacity style={styles.oauthBtn} onPress={() => handleSimulateOAuth('Gmail')}>
                  <Mail color={Colors.primary} size={18} />
                  <Text style={styles.oauthBtnText}>Connect Gmail</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.oauthBtn} onPress={() => handleSimulateOAuth('Outlook')}>
                  <Mail color={Colors.primary} size={18} />
                  <Text style={styles.oauthBtnText}>Connect Outlook</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAccountModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : oauthStep === 'connecting' ? (
              <View style={styles.oauthStatus}>
                <RefreshCw color={Colors.primary} size={28} />
                <Text style={styles.oauthStatusText}>Connecting…</Text>
              </View>
            ) : (
              <View style={styles.oauthStatus}>
                <CheckCircle2 color={Colors.success} size={28} />
                <Text style={[styles.oauthStatusText, { color: Colors.success }]}>Connected successfully!</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Camera Modal */}
      <Modal visible={showCameraModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Live Camera Scan</Text>
            <View style={styles.cameraView}>
              {Platform.OS === 'web' ? (
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <Camera color={Colors.textMuted} size={42} />
                  <Text style={styles.cameraPlaceholderText}>Web environment only</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.scanBtn} onPress={handleCaptureFrame}>
              <Camera color="#fff" size={15} />
              <Text style={styles.scanBtnText}>Capture & Analyze</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={stopCamera}>
              <Text style={styles.cancelBtnText}>Close Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 48,
  },

  // Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  engineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  engineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Title
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: 24,
  },

  // Scan banner
  scanBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    alignItems: 'center',
  },
  scanningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanningPillText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Upload action cards
  uploadCardList: {
    gap: 10,
    marginBottom: 20,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadCardText: {
    flex: 1,
  },
  uploadCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  uploadCardSub: {
    fontSize: 13,
    color: Colors.textMuted,
  },

  // Text input card
  textInputCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  textInputWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
    outlineStyle: 'none',
    lineHeight: 22,
  },
  pasteIconBtn: {
    padding: 4,
    justifyContent: 'flex-start',
  },
  scanBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Easier Alternative panel
  alternativePanel: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: 16,
    ...Shadows.card,
  },
  altIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  altIconWrap: {
    position: 'relative',
  },
  altIconBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  altTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  altDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Privacy notice
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 28,
  },
  privacyText: {
    fontSize: 12,
    color: Colors.textLight,
  },

  // Recent scans
  recentSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  logList: {
    gap: 10,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
    gap: 10,
  },
  logCardScanning: {
    borderColor: Colors.primaryLight,
  },
  logCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  logTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  logCardInfo: {
    flex: 1,
  },
  logCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  logCardSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logCardRight: {
    alignItems: 'flex-end',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scorePillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Modals
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
    ...Shadows.cardMd,
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
  oauthStack: {
    gap: 12,
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 14,
  },
  oauthBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
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
  oauthStatus: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  oauthStatusText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  cameraView: {
    height: 220,
    backgroundColor: Colors.background,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    alignItems: 'center',
    gap: 10,
  },
  cameraPlaceholderText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
});
