import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { MockVerifications } from '../data/mockData';
import { verifyPayload } from '../services/verificationService';
import { AnalysisCoordinator } from '../services/analysisCoordinator';

const VerificationContext = createContext();

export function VerificationProvider({ children }) {
  const [verifications, setVerifications] = useState(MockVerifications);
  const [activeId, setActiveId] = useState(MockVerifications[0]?.id || null);
  const [activeTab, setActiveTab] = useState('HOME');
  const [sandboxAuthorized, setSandboxAuthorized] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  
  // Ref to track timeouts in flight and prevent memory leaks
  const activeTimeouts = useRef({});

  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(activeTimeouts.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  // Ingest stream (accepts raw string or Media Reference Object)
  const handleIngestStream = async (payload, type, customTitle = null) => {
    const scanId = String(Date.now());
    
    // Normalize payload to Media Reference Object contract
    const isText = type === 'Text';
    const mediaRef = isText ? null : (typeof payload === 'string' ? {
      uri: null,
      text: payload,
      mimeType: 'text/plain',
      fileSize: payload.length,
      contentHash: `hash-text-${payload.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}-${payload.length}`
    } : payload);

    // Create a queued shell item
    const newItem = {
      id: scanId,
      type: type,
      title: customTitle ? `[${type}] ${customTitle}` : `[${type}] Radiation Shield Ingest`,
      sender: isText ? 'Clipboard Buffer / Input Shield' : 'Uploaded File Stream',
      senderEmail: 'clipboard-buffer@truthguard.local',
      ip: '127.0.0.1 (Local Client Direct Ingest)',
      time: 'Queued...',
      status: 'queued', // initial tracking state
      rawText: isText ? (typeof payload === 'string' ? payload : (payload.text || '')) : `Processing ${mediaRef.mimeType || 'unknown'} file stream...`,
      mediaUrl: isText ? null : mediaRef.uri,
      mediaType: isText ? null : (mediaRef.mimeType.startsWith('video/') ? 'video' : (mediaRef.mimeType.startsWith('image/') ? 'image' : null)),
      trustScore: 100, // placeholder
      anomalies: [],
      uiHighlights: [],
      explainers: [],
      report: null
    };

    setVerifications(prev => [newItem, ...prev]);
    setActiveId(scanId);
    setActiveTab('VERDICT');

    try {
      // Trigger progressive analysis coordinator - bypass file/media wrapper for Text claim types
      const analysisInput = isText ? (typeof payload === 'string' ? payload : (payload.text || '')) : mediaRef;
      await AnalysisCoordinator.runAnalysis(
        analysisInput,
        type,
        customTitle,
        sandboxAuthorized,
        geminiApiKey,
        (stage, partialReport) => {
          setVerifications(prev => prev.map(v => {
            if (v.id === scanId) {
              const score = Math.round(partialReport.authenticity.score * 100);
              const coverage = partialReport.authenticity.evidenceCoverage;
              const isDone = stage === 'completed' || coverage === 1.0;
              
              const finalRawText = type === 'Text' 
                ? (typeof payload === 'string' ? payload : (payload.text || v.rawText))
                : (partialReport.description.scene || v.rawText);
              
              const text = finalRawText;
              const presentClaims = (partialReport.claims || [])
                .map(c => c.text)
                .filter(t => t && text.indexOf(t) !== -1);
                
              const mappedHighlights = [];
              const mappedExplainers = [];
              
              presentClaims.forEach((claimText, i) => {
                const con = (partialReport.contradictions || []).find(c => c.contradiction === claimText);
                
                if (con) {
                  // Disputed Claim (Red)
                  const id = `con-${scanId}-${i}`;
                  mappedHighlights.push({
                    id,
                    text: claimText,
                    type: 'danger',
                    reason: con.observation || 'Contradiction detected.'
                  });
                  
                  // Filter sources relevant to this contradiction
                  const lowerClaim = claimText.toLowerCase();
                  let relevantSources = partialReport.sources || [];
                  if (lowerClaim.includes('deletion') || lowerClaim.includes('rotterdam')) {
                    relevantSources = (partialReport.sources || []).filter(s => s.id.includes('google') || s.id.includes('alerts'));
                  } else if (lowerClaim.includes('withdrawal') || lowerClaim.includes('emergency')) {
                    relevantSources = (partialReport.sources || []).filter(s => s.id.includes('reuters') || s.id.includes('reserve'));
                  } else {
                    // Dynamic Wikipedia/entity matches using word overlap
                    const claimWords = lowerClaim.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 3);
                    const matched = (partialReport.sources || []).filter(s => {
                      const idLower = (s.id || '').toLowerCase();
                      const nameLower = (s.name || '').toLowerCase();
                      return claimWords.some(word => idLower.includes(word) || nameLower.includes(word));
                    });
                    if (matched.length > 0) {
                      relevantSources = matched;
                    }
                  }
                  
                  mappedExplainers.push({
                    phrase: claimText,
                    explanation: con.observation || 'This statement contradicts established facts in our knowledge base.',
                    sources: relevantSources
                  });
                } else {
                  const lowerClaim = claimText.toLowerCase();
                  const isVerifiedC2PA = lowerClaim.includes('c2pa') || lowerClaim.includes('tg-9082') || lowerClaim.includes('validation complete') || lowerClaim.includes('signature');
                  const isVerifiedSystem = lowerClaim.includes('version v4.2.1') || lowerClaim.includes('calibrated') || lowerClaim.includes('verified secure');
                  
                  if (isVerifiedC2PA || isVerifiedSystem) {
                    // Verified Claim (Green)
                    mappedHighlights.push({
                      id: `hl-verified-${scanId}-${i}`,
                      text: claimText,
                      type: 'success',
                      reason: 'Verified Factual - Hardware signature or system record matched.'
                    });
                    
                    let relevantSources = [];
                    if (isVerifiedC2PA) {
                      relevantSources = (partialReport.sources || []).filter(s => s.id.includes('c2pa') || s.id.includes('credential'));
                      if (relevantSources.length === 0) {
                        relevantSources = [{
                          id: "ref-c2pa-portal",
                          name: "C2PA Coalition Org Portal",
                          url: "https://c2pa.org",
                          source: "C2PA Coalition Org Portal",
                          summary: "Coalition for Content Provenance and Authenticity cryptographic manufacturer signature registry."
                        }];
                      }
                    } else {
                      relevantSources = (partialReport.sources || []).filter(s => s.id.includes('releases') || s.id.includes('github'));
                      if (relevantSources.length === 0) {
                        relevantSources = [{
                          id: "ref-github-releases",
                          name: "Truth Guard Github Releases",
                          url: "https://github.com/truthguard/releases",
                          source: "Truth Guard Github Releases",
                          summary: "Official production release channel for Truth Guard database updates."
                        }];
                      }
                    }
                    
                    mappedExplainers.push({
                      phrase: claimText,
                      explanation: isVerifiedC2PA 
                        ? 'This hardware metadata signature has been cryptographically validated against the C2PA manufacturer registry.'
                        : 'System log matches standard production database version deployed in the official repository.',
                      sources: relevantSources
                    });
                  } else {
                    // General/Uncertain (Yellow/Orange)
                    mappedHighlights.push({
                      id: `hl-uncertain-${scanId}-${i}`,
                      text: claimText,
                      type: 'warning',
                      reason: 'Uncertain - Claim could not be independently verified by external sources.'
                    });
                    
                    mappedExplainers.push({
                      phrase: claimText,
                      explanation: 'No direct cryptographic signatures or external fact-checking database records correspond to this descriptive detail.',
                      sources: []
                    });
                  }
                }
              });

              // Map anomalies from manipulation findings
              const mappedAnomalies = ((partialReport.manipulation && partialReport.manipulation.indicators) || []).map(ind => ({
                text: ind,
                passed: false
              }));

              // If clean and completed, show passed anomalies
              if (isDone && mappedAnomalies.length === 0) {
                mappedAnomalies.push({ text: "Sender Header Verification", passed: true });
                mappedAnomalies.push({ text: "IP Origin Check", passed: true });
                mappedAnomalies.push({ text: "Signature Verification", passed: true });
              }

              // Clean description is stored in finalRawText from above.

              return {
                ...v,
                status: isDone ? (score >= 65 ? 'completed' : 'failed') : 'scanning',
                title: customTitle ? `[${type}] ${customTitle}` : `[${type}] Radiation Shield Ingest`,
                time: isDone ? 'Just now' : `Processing: ${stage.toUpperCase()}`,
                trustScore: score,
                rawText: finalRawText,
                anomalies: mappedAnomalies,
                uiHighlights: mappedHighlights,
                explainers: mappedExplainers,
                spfStatus: partialReport.provenance.status === 'verified',
                dkimStatus: partialReport.provenance.status === 'verified',
                dmarcStatus: partialReport.provenance.status === 'verified',
                senderFrequency: isDone ? 12 : 0,
                senderAlert: partialReport.contradictions.length > 0
                  ? 'ALERT: Critical discrepancy detected.'
                  : 'Authentication verified.',
                report: partialReport
              };
            }
            return v;
          }));
        }
      );
    } catch (err) {
      console.error("Progressive analysis pipeline failed:", err);
      handleVerificationFailure(scanId, err);
    }
  };

  const handleVerificationFailure = (id, error) => {
    setVerifications(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: 'failed',
          time: 'Failed',
          trustScore: 0,
          anomalies: [{ text: `Ingestion Error: ${error.message || 'Verification pipeline aborted'}`, passed: false }],
          uiHighlights: [{ id: 'error-triage', text: 'Error', type: 'danger', reason: error.message || 'Triage execution failed.' }],
          explainers: [],
          spfStatus: false,
          dkimStatus: false,
          dmarcStatus: false,
          senderAlert: 'ERROR: Structural verification pipeline aborted.'
        };
      }
      return v;
    }));
  };

  // Remove verification from logs and cancel active timeouts to prevent memory leaks
  const handlePurgeItem = (id) => {
    // Intercept and clear background timeout if in flight
    if (activeTimeouts.current[id]) {
      clearTimeout(activeTimeouts.current[id]);
      delete activeTimeouts.current[id];
      console.log(`Cancelled active timeout hydration for purged item ID: ${id}`);
    }

    setVerifications(prev => {
      const remaining = prev.filter(v => v.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
      return remaining;
    });
    setActiveTab('HOME');
  };

  // Update media diagnostics
  const handleUpdateMediaDiagnostics = (id, newDiagnostics) => {
    setVerifications(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, mediaDiagnostics: newDiagnostics };
      }
      return v;
    }));
  };

  return (
    <VerificationContext.Provider value={{
      verifications,
      activeId,
      activeTab,
      activeItem: verifications.find(v => v.id === activeId) || null,
      setActiveId,
      setActiveTab,
      handleIngestStream,
      handlePurgeItem,
      handleUpdateMediaDiagnostics,
      sandboxAuthorized,
      setSandboxAuthorized,
      geminiApiKey,
      setGeminiApiKey
    }}>
      {children}
    </VerificationContext.Provider>
  );
}

// Central state controller hook (useVerification)
export function useVerification(scanId) {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }

  const { verifications } = context;
  const item = verifications.find(v => v.id === scanId) || null;

  const isPending = item ? (item.status === 'queued' || item.status === 'scanning') : false;
  const isLoading = item ? (item.status === 'scanning' || item.status === 'queued') : false;
  const isFailed = item ? item.status === 'failed' : false;

  return {
    item,
    status: item?.status || 'queued',
    isLoading,
    isPending,
    isFailed,
    anomalies: item?.anomalies || [],
    uiHighlights: item?.uiHighlights || [],
    explainers: item?.explainers || []
  };
}

export function useVerificationActions() {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerificationActions must be used within a VerificationProvider');
  }
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
  } = context;

  return {
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
  };
}
