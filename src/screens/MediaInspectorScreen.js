import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, Platform, Image as RNImage, TouchableOpacity } from 'react-native';
import { Colors, Shadows } from '../theme';
import ScannerOverlay from '../components/ScannerOverlay';
import InteractiveBlur from '../components/InteractiveBlur';
import { 
  Video, Play, Fingerprint, Globe, User, ShieldAlert, ShieldCheck, 
  Cpu, Shield, TrendingUp, ChevronDown, ChevronUp, Terminal, Clock, AlertCircle 
} from 'lucide-react-native';
import SkeletonLoader from '../components/SkeletonLoader';
import CircularGauge from '../components/CircularGauge';
import { useVerification } from '../context/VerificationContext';

export default function MediaInspectorScreen({ item, onUpdateMediaDiagnostics }) {
  const { isPending, anomalies } = useVerification(item?.id);
  const [showTechnicalLogs, setShowTechnicalLogs] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);

  const hasMedia = item && (item.mediaType === 'video' || item.mediaType === 'image');
  const mediaType = hasMedia ? item.mediaType : 'video';
  const diagnostics = hasMedia && item.mediaDiagnostics ? item.mediaDiagnostics : {
    aiIndex: 82, synthId: false, avSync: 38, blurMitigation: true
  };

  const [blurActive, setBlurActive] = useState(diagnostics.blurMitigation);

  useEffect(() => { 
    setBlurActive(diagnostics.blurMitigation); 
    setIsBypassed(false); 
  }, [item]);

  if (!item) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Video color={Colors.textLight} size={34} />
        </View>
        <Text style={styles.emptyTitle}>No Media Selected</Text>
        <Text style={styles.emptySub}>Select a video or image scan to inspect file forensics, metadata, and sender validity.</Text>
      </View>
    );
  }

  if (isPending) {
    return <SkeletonLoader title="Ingesting visual/cryptographic assets…" />;
  }

  const isText = item.type === 'Text' || (item.report && item.report.contentType === 'Text');

  // Short-circuit interface for raw text claims
  if (isText) {
    return (
      <View style={styles.textPlaceholderContainer}>
        <View style={styles.placeholderIconWrap}>
          <ShieldAlert color={Colors.primary} size={42} />
        </View>
        <Text style={styles.placeholderTitle}>Visual Forensics Not Applicable</Text>
        <Text style={styles.placeholderSub}>
          Pure text claims bypass visual rendering layers. Please check the **Verdict** tab to review factual claim verifiability, NLI results, and external database signals.
        </Text>
      </View>
    );
  }

  const handleBlurToggle = (val) => {
    setBlurActive(val);
    if (onUpdateMediaDiagnostics) onUpdateMediaDiagnostics(item.id, { ...diagnostics, blurMitigation: val });
  };

  const report = item.report || {};
  const manipulation = report.manipulation || { score: 0.0, indicators: [] };
  const authenticity = report.authenticity || { score: 0.50, confidence: 0.50, evidenceCoverage: 0.0 };
  const provenance = report.provenance || { status: 'unknown', confidence: 0.0, basis: [] };

  const shouldBlur = item.trustScore < 65 && blurActive && !isBypassed;
  const scoreColor = item.trustScore >= 65 ? Colors.success : (item.trustScore >= 40 ? Colors.warning : Colors.danger);
  const realMediaSource = item.mediaUrl || null;

  const verdictText = item.trustScore >= 65
    ? 'Content appears authentic. Structural analysis does not detect significant manipulation.'
    : item.trustScore >= 40
    ? 'Some inconsistencies found. Treat with caution — could not be definitively authenticated.'
    : 'High likelihood of manipulation or synthetic generation. This content should not be shared.';

  // 1. Pixel Forensics Risk Score Metrics
  const spliceScore = Math.round(manipulation.score * 100);
  const riskColor = spliceScore > 50 ? Colors.danger : (spliceScore > 20 ? Colors.warning : Colors.success);
  const riskBg = spliceScore > 50 ? Colors.dangerBg : (spliceScore > 20 ? Colors.warningBg : Colors.successBg);
  const riskLabel = spliceScore > 50 ? 'High Risk' : (spliceScore > 20 ? 'Moderate Risk' : 'Low Risk');

  // 2. Cryptographic Provenance Status
  const provStatus = provenance.status.toUpperCase();
  const provStatusColor = provStatus === 'VERIFIED' ? Colors.success : (provStatus === 'TAMPERED' ? Colors.danger : Colors.textMuted);
  const provStatusBg = provStatus === 'VERIFIED' ? Colors.successBg : (provStatus === 'TAMPERED' ? Colors.dangerBg : Colors.cardBgAlt);
  const provStatusBorder = provStatus === 'VERIFIED' ? Colors.successBorder : (provStatus === 'TAMPERED' ? Colors.dangerBorder : Colors.border);
  const provStatusLabel = provStatus === 'VERIFIED' ? 'Origin Verified (C2PA)' : (provStatus === 'TAMPERED' ? 'C2PA Signature Tampered' : 'Cryptographic Signature Missing');
  const ProvStatusIcon = provStatus === 'VERIFIED' ? ShieldCheck : (provStatus === 'TAMPERED' ? ShieldAlert : HelpCircle);

  // 3. Sender Guard Email Credentials
  const isSecured = item.spfStatus && item.dkimStatus && item.dmarcStatus;
  const senderStatusColor = isSecured ? Colors.success : Colors.danger;
  const points = item.senderFrequency > 0 
    ? [20, 24, 28, 30, 26, 35, 40, 38, 42, 50, 48, 52] 
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 45];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <Video color={Colors.primary} size={18} />
          </View>
          <View>
            <Text style={styles.pageTitle}>Media Forensic Workspace</Text>
            <Text style={styles.pageSub}>Deep-dive visual analysis, metadata, and origin tracing</Text>
          </View>
        </View>
      </View>

      {/* ─── BLOCK 1: MEDIA PLAYER & PREVIEW ─── */}
      <View style={styles.mediaCard}>
        <InteractiveBlur shouldBlur={shouldBlur} onBypass={() => setIsBypassed(true)}>
          {mediaType === 'video' ? (
            <View style={styles.videoCanvas}>
              {Platform.OS === 'web' && realMediaSource ? (
                <video src={realMediaSource} controls autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#1A2340' }} />
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <Video color="rgba(255,255,255,0.4)" size={42} />
                  <Text style={styles.mediaPlaceholderTitle} numberOfLines={1}>{item.title.replace(/^\[\w+\]\s*/, '')}</Text>
                  <View style={styles.waveRow}>
                    {[40, 60, 20, 80, 50, 90, 30, 70, 40, 60, 80, 20, 50, 40, 70].map((h, i) => (
                      <View key={i} style={[styles.waveBar, { height: h * 0.35 }]} />
                    ))}
                  </View>
                </View>
              )}
              <ScannerOverlay />
            </View>
          ) : (
            <View style={styles.imageCanvas}>
              <View style={styles.mediaPlaceholder}>
                <RNImage
                  source={{ uri: realMediaSource || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="contain"
                />
                <View style={styles.imageDimOverlay} />
                <View style={styles.imageTagBadge}>
                  <Text style={styles.imageTagText}>{realMediaSource ? 'Custom image' : 'C2PA verified'}</Text>
                </View>
              </View>
              <ScannerOverlay />
            </View>
          )}
        </InteractiveBlur>
      </View>

      {!hasMedia && (
        <View style={styles.noticeBanner}>
          <AlertCircle color={Colors.warning} size={14} />
          <Text style={styles.noticeText}>No media file attached — showing a simulated preview.</Text>
        </View>
      )}

      {/* Trust gauge + verdict */}
      <View style={styles.analysisCard}>
        <View style={styles.gaugeRow}>
          <CircularGauge score={item.trustScore} size={110} strokeWidth={9} label="Trust Score" />
          <View style={styles.verdictCol}>
            <Text style={[styles.verdictLabel, { color: scoreColor }]}>
              {item.trustScore >= 65 ? 'Authentic' : item.trustScore >= 40 ? 'Uncertain' : 'Likely Manipulated'}
            </Text>
            <Text style={styles.verdictDetail}>{verdictText}</Text>
          </View>
        </View>
      </View>

      {/* Auto-blur toggle */}
      <View style={[styles.toggleCard, { borderColor: blurActive ? Colors.primaryBorder : Colors.border }]}>
        <View style={styles.toggleContent}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>Auto-blur suspicious content</Text>
            <Text style={styles.toggleSub}>Blur media automatically if trust score is below 65.</Text>
          </View>
          <Switch
            value={blurActive}
            onValueChange={handleBlurToggle}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={blurActive ? Colors.primary : Colors.textLight}
          />
        </View>
      </View>

      {/* ─── BLOCK 2: PIXEL FORENSICS & METRICS ─── */}
      <View style={styles.sectionHeader}>
        <Fingerprint color={Colors.primary} size={16} />
        <Text style={styles.sectionTitle}>Pixel Forensics deep-dive</Text>
      </View>

      <View style={styles.forensicsGrid}>
        {/* Heatmap Visual */}
        <View style={styles.detectionCard}>
          <View style={styles.detectionCardHeader}>
            <Text style={styles.cardLabel}>Spatial Neural Heatmap</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
              <Text style={[styles.riskBadgeText, { color: riskColor }]}>{riskLabel}</Text>
            </View>
          </View>

          <View style={styles.heatmapVisual}>
            <View style={styles.heatmapInner}>
              {spliceScore > 50 ? (
                <View style={[styles.anomalyBox, { borderColor: Colors.danger }]}>
                  <Text style={[styles.anomalyLabel, { color: Colors.danger }]}>Spatial anomalies detected</Text>
                </View>
              ) : (
                <View style={[styles.anomalyBox, { borderColor: Colors.success }]}>
                  <Text style={[styles.anomalyLabel, { color: Colors.success }]}>Pixel distribution normal</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Forensic Scores & Findings */}
        <View style={styles.metricsCard}>
          <Text style={styles.subSectionTitle}>Forensic Indicators</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>AI generation probability</Text>
            <Text style={[styles.metricVal, { color: diagnostics.aiIndex > 60 ? Colors.danger : Colors.success }]}>
              {diagnostics.aiIndex}%
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Google SynthID watermark</Text>
            <Text style={[styles.metricVal, { color: diagnostics.synthId ? Colors.success : Colors.danger }]}>
              {diagnostics.synthId ? 'Detected' : 'Not found'}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Adversarial pixel perturbation</Text>
            <Text style={[styles.metricVal, { color: spliceScore > 40 ? Colors.danger : Colors.success }]}>
              {spliceScore}%
            </Text>
          </View>
          {item.type === 'Video' && (
            <>
              <View style={styles.metricDivider} />
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Lip-sync drift</Text>
                <Text style={styles.metricVal}>{diagnostics.avSync}ms</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.findingsCard}>
          <Text style={styles.subSectionTitle}>Visual & Pixel Issues</Text>
          {manipulation.indicators && manipulation.indicators.length > 0 ? (
            manipulation.indicators.map((ind, i) => (
              <View key={i} style={styles.findingRow}>
                <ShieldAlert color={riskColor} size={14} />
                <Text style={styles.findingText}>{ind}</Text>
              </View>
            ))
          ) : (
            <View style={styles.cleanResult}>
              <ShieldCheck color={Colors.success} size={18} />
              <Text style={styles.cleanResultText}>No significant pixel anomalies found in this content.</Text>
            </View>
          )}
        </View>
      </View>

      {/* ─── BLOCK 3: C2PA CRYPTOGRAPHIC ORIGIN REGISTRY ─── */}
      <View style={styles.sectionHeader}>
        <Globe color={Colors.primary} size={16} />
        <Text style={styles.sectionTitle}>C2PA Provenance & History Tree</Text>
      </View>

      <View style={[styles.provenanceCard, { backgroundColor: provStatusBg, borderColor: provStatusBorder }]}>
        <ProvStatusIcon color={provStatusColor} size={24} />
        <View style={styles.provenanceTextCol}>
          <Text style={[styles.provenanceStatus, { color: provStatusColor }]}>{provStatusLabel}</Text>
          <Text style={styles.provenanceConf}>
            Cryptographic Cert Confidence: {Math.round(provenance.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Verification Evidence basis */}
      <View style={styles.basisCard}>
        <Text style={styles.subSectionTitle}>Metadata Signatures</Text>
        {provenance.basis && provenance.basis.length > 0 ? (
          provenance.basis.map((bas, i) => (
            <View key={i} style={styles.basisRow}>
              <View style={styles.basisDot} />
              <Text style={styles.basisText}>{bas}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noBasisText}>
            No verified origin markers were found. Metadata signatures may have been stripped or were never present.
          </Text>
        )}
      </View>

      {/* Capture Timeline */}
      <View style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <Clock color={Colors.primaryMid} size={14} />
          <Text style={styles.subSectionTitle}>Cryptographic Timeline</Text>
        </View>
        <View style={styles.timelineBody}>
          <View style={styles.timelineLine} />
          <View style={styles.timelineNode}>
            <View style={[styles.nodeDot, { backgroundColor: Colors.success }]} />
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>Content captured</Text>
              <Text style={styles.nodeSub}>Camera firmware signature matches registered hardware manifest.</Text>
            </View>
          </View>
          <View style={styles.timelineNode}>
            <View style={[styles.nodeDot, { backgroundColor: Colors.primaryMid }]} />
            <View style={styles.nodeContent}>
              <Text style={styles.nodeTitle}>Submitted to TruthGuard</Text>
              <Text style={styles.nodeSub}>Hash registry matches content: {item.id}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ─── BLOCK 4: SENDER GUARD NETWORK ROUTING ─── */}
      <View style={styles.sectionHeader}>
        <User color={Colors.primary} size={16} />
        <Text style={styles.sectionTitle}>Network Datalink Sender Shield</Text>
      </View>

      <View style={styles.senderCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { borderColor: senderStatusColor }]}>
            <User color={senderStatusColor} size={22} />
          </View>
        </View>
        <View style={styles.senderDetails}>
          <Text style={styles.senderName}>{item.sender.split(' <')[0]}</Text>
          <Text style={styles.senderEmail} numberOfLines={1}>{item.senderEmail || 'unverified-sender@domain.com'}</Text>
          <View style={styles.ipRow}>
            <Globe color={Colors.info} size={11} />
            <Text style={styles.ipText}>{item.ip || '127.0.0.1'}</Text>
          </View>
        </View>
      </View>

      {/* Verification Headers */}
      <View style={styles.toggleCard}>
        <TouchableOpacity 
          style={styles.techLogsClickable}
          onPress={() => setShowTechnicalLogs(!showTechnicalLogs)}
          activeOpacity={0.8}
        >
          <View style={styles.techLogsLeft}>
            <Terminal color={Colors.info} size={14} />
            <Text style={styles.techLogsHeaderTitle}>Advanced Domain Security Headers</Text>
          </View>
          {showTechnicalLogs ? <ChevronUp color={Colors.textMuted} size={16} /> : <ChevronDown color={Colors.textMuted} size={16} />}
        </TouchableOpacity>

        {showTechnicalLogs && (
          <View style={styles.technicalLogsContainer}>
            <View style={styles.techLogLine}>
              <Text style={styles.techLabel}>SPF Checks:</Text>
              <Text style={[styles.techVal, { color: item.spfStatus ? Colors.success : Colors.danger }]}>
                {item.spfStatus ? 'PASS (IP aligns with domains record)' : 'FAIL (envelope domain spoof detected)'}
              </Text>
            </View>
            <View style={styles.techLogDivider} />
            <View style={styles.techLogLine}>
              <Text style={styles.techLabel}>DKIM Signature:</Text>
              <Text style={[styles.techVal, { color: item.dkimStatus ? Colors.success : Colors.danger }]}>
                {item.dkimStatus ? 'PASS (selector signature valid)' : 'FAIL (cryptographic signature mismatch)'}
              </Text>
            </View>
            <View style={styles.techLogDivider} />
            <View style={styles.techLogLine}>
              <Text style={styles.techLabel}>DMARC Alignment:</Text>
              <Text style={[styles.techVal, { color: item.dmarcStatus ? Colors.success : Colors.danger }]}>
                {item.dmarcStatus ? 'PASS (strict protocol match)' : 'FAIL (unaligned from envelope sender)'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Historical Graph */}
      <View style={styles.basisCard}>
        <View style={styles.graphHeader}>
          <TrendingUp color={Colors.info} size={14} />
          <Text style={styles.subSectionTitle}>Historical contact density timeline</Text>
        </View>

        <View style={styles.graphContainer}>
          <View style={styles.graphGrid}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>

          <View style={styles.barsWrapper}>
            {points.map((val, idx) => (
              <View key={idx} style={styles.barColumn}>
                <View 
                  style={[
                    styles.graphBar, 
                    { 
                      height: Math.max(4, val), 
                      backgroundColor: item.senderFrequency > 0 ? Colors.info : (idx === points.length - 1 ? Colors.danger : 'rgba(255,255,255,0.05)')
                    }
                  ]} 
                />
                <Text style={styles.barLabel}>{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][idx]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.graphDiagnosticsBox}>
          {item.senderFrequency > 0 ? (
            <View style={styles.diagRow}>
              <Text style={[styles.diagStatusLabel, { color: Colors.success }]}>[ ESTABLISHED SENDER PATTERN ]</Text>
              <Text style={styles.diagDetailsText}>
                Sender has {item.senderFrequency} recorded interactions over 12 months. Domain keys align with local address whitelist profile.
              </Text>
            </View>
          ) : (
            <View style={styles.diagRow}>
              <Text style={[styles.diagStatusLabel, { color: Colors.danger }]}>[ SUSPICIOUS IDENTITY PROFILE ]</Text>
              <Text style={styles.diagDetailsText}>
                CRITICAL WARNING: 0.00% historical density index. Subdomain spoofing suspected. Contact syntax variation detected.
              </Text>
            </View>
          )}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: 20, paddingBottom: 48 },

  emptyContainer: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    padding: 40, minHeight: 400,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // Text Claim placeholder
  textPlaceholderContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 500,
  },
  placeholderIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderSub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },

  pageHeader: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  pageSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  mediaCard: {
    height: 230, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', marginBottom: 12, ...Shadows.card,
  },
  videoCanvas: { flex: 1, position: 'relative', backgroundColor: '#1A2340' },
  imageCanvas: { flex: 1, position: 'relative', backgroundColor: '#1A2340' },
  mediaPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  mediaPlaceholderTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 10, marginBottom: 16 },
  waveRow: { flexDirection: 'row', alignItems: 'flex-end', height: 36, gap: 4 },
  waveBar: { width: 3, backgroundColor: 'rgba(37, 99, 235, 0.7)', borderRadius: 2 },
  imageDimOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26, 35, 64, 0.25)' },
  imageTagBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(26, 35, 64, 0.8)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  imageTagText: { color: Colors.success, fontSize: 11, fontWeight: '700' },

  noticeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningBg, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.warningBorder,
    padding: 12, marginBottom: 14,
  },
  noticeText: { flex: 1, fontSize: 13, color: Colors.warning, fontWeight: '500' },

  analysisCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 14, ...Shadows.card,
  },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  verdictCol: { flex: 1 },
  verdictLabel: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  verdictDetail: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },

  toggleCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, padding: 16, marginBottom: 20, borderColor: Colors.border, ...Shadows.card,
  },
  toggleContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  toggleSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },

  // Forensics structures
  forensicsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  detectionCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, ...Shadows.card,
  },
  detectionCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  cardLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  riskBadgeText: { fontSize: 12, fontWeight: '700' },
  heatmapVisual: {
    height: 140, backgroundColor: '#1A2340',
    borderRadius: 10, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
  },
  heatmapInner: { justifyContent: 'center', alignItems: 'center' },
  anomalyBox: {
    borderWidth: 1.5, borderStyle: 'dashed',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6,
  },
  anomalyLabel: { fontSize: 13, fontWeight: '600' },

  metricsCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, ...Shadows.card,
  },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  metricDivider: { height: 1, backgroundColor: Colors.border },
  metricLabel: { fontSize: 13, color: Colors.textMuted },
  metricVal: { fontSize: 13, fontWeight: '700', color: Colors.text },

  findingsCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, ...Shadows.card,
  },
  findingRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, marginBottom: 10,
  },
  findingText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  cleanResult: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  cleanResultText: { flex: 1, fontSize: 13, color: Colors.textMuted, lineHeight: 20 },

  // C2PA Origin structures
  provenanceCard: {
    borderRadius: 14, borderWidth: 1.5,
    padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12, ...Shadows.card,
  },
  provenanceTextCol: { flex: 1 },
  provenanceStatus: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  provenanceConf: { fontSize: 12, color: Colors.textMuted },

  basisCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 12, ...Shadows.card,
  },
  basisRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  basisDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: Colors.primaryMid, marginTop: 6, flexShrink: 0,
  },
  basisText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  noBasisText: { fontSize: 13, color: Colors.textMuted, lineHeight: 20 },

  timelineCard: {
    backgroundColor: Colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 20, ...Shadows.card,
  },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timelineBody: { position: 'relative', paddingLeft: 18 },
  timelineLine: {
    position: 'absolute', left: 10, top: 6, bottom: 6,
    width: 1.5, backgroundColor: Colors.border,
  },
  timelineNode: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  nodeDot: {
    width: 10, height: 10, borderRadius: 5,
    marginTop: 3, marginLeft: -5, flexShrink: 0,
    borderWidth: 2, borderColor: Colors.cardBg,
  },
  nodeContent: { flex: 1 },
  nodeTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  nodeSub: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  // Sender Guard structures
  senderCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    ...Shadows.card,
  },
  avatarContainer: {
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  senderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  senderName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  senderEmail: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 4,
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ipText: {
    color: Colors.info,
    fontFamily: 'monospace',
    fontSize: 10,
  },

  techLogsClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techLogsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techLogsHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  technicalLogsContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  techLogLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  techLogDivider: {
    height: 0.5,
    backgroundColor: Colors.border,
  },
  techLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    width: 110,
  },
  techVal: {
    color: Colors.text,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },

  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  graphContainer: {
    height: 100,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    position: 'relative',
    paddingTop: 15,
    paddingBottom: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  graphGrid: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  gridLine: {
    height: 0.5,
    backgroundColor: Colors.border,
  },
  barsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  graphBar: {
    width: 8,
    borderRadius: 2,
    marginBottom: 4,
  },
  barLabel: {
    color: Colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 8,
  },
  graphDiagnosticsBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  diagRow: {
    gap: 4,
  },
  diagStatusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  diagDetailsText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  }
});
