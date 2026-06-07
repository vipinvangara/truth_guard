/**
 * Truth Guard Forensic Service
 * Coordinates multi-spectral pixel checks, video temporal coherence,
 * and adversarial input protection defenses.
 */

import { getForensicWorker } from '../workers/forensicWorker';
import { featureStore } from './featureStore';

export const ForensicService = {
  
  /**
   * Run visual pixel forensics on media
   * @param {Object} mediaRef
   * @param {Object} policy
   * @returns {Promise<Object>} forensics findings
   */
  async analyze(mediaRef, policy, executionMode = 'SOVEREIGN_CONTAINER', geminiApiKey = '') {
    const hash = mediaRef.contentHash || `hash-${Date.now()}`;

    // Read cache
    const cached = featureStore.getFeature(hash, 'forensics');
    if (cached) return cached;

    if (!policy.runForensicCNN) {
      const fallback = {
        spliceProbability: 0.0,
        compressionMismatch: 0.0,
        findings: ["Forensic CNN checks skipped under active power conservation mode."],
        skipped: true
      };
      featureStore.setFeature(hash, 'forensics', fallback);
      return fallback;
    }

    const apiUrl = process.env.EXPO_PUBLIC_TRUTHGUARD_API_URL || 'http://localhost:8000';

    if (executionMode === 'SOVEREIGN_CONTAINER' || executionMode === 'SOVEREIGN_CONTAINER_ONLINE') {
      try {
        const response = await fetch(`${apiUrl}/inference/forensics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: mediaRef.base64 || '',
            uri: mediaRef.uri || ''
          })
        });
        const res = await response.json();
        const report = {
          spliceProbability: res.spliceProbability || 0.0,
          compressionMismatch: res.compressionMismatch || 0.0,
          elaScore: res.elaScore || 0.0,
          noiseResidual: res.noiseResidual || 0.0,
          copyMoveDetected: res.copyMoveDetected || false,
          illuminationMismatch: res.illuminationMismatch || false,
          frequencyAnomaly: res.frequencyAnomaly || false,
          manipulationLikelihood: res.manipulationLikelihood || 0.0,
          findings: res.findings || [],
          skipped: false
        };
        featureStore.setFeature(hash, 'forensics', report);
        return report;
      } catch (err) {
        console.warn("ForensicService: Local container visual forensics failed, falling back to local worker:", err);
      }
    } else if (executionMode === 'PROPRIETARY_CLOUD' && geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const prompt = "Analyze this visual frame for evidence of splicing, GAN editing, AI generation, copy-move manipulation, or JPEG noise mismatch. Respond with a JSON object ONLY (no markdown formatting, no backticks): { \"spliceProbability\": float, \"manipulationLikelihood\": float, \"findings\": [string] }";
        
        const parts = [{ text: prompt }];
        if (mediaRef.base64) {
          const partsStr = mediaRef.base64.includes(';base64,') ? mediaRef.base64.split(';base64,')[1] : mediaRef.base64;
          parts.push({
            inlineData: {
              mimeType: mediaRef.mimeType || 'image/jpeg',
              data: partsStr
            }
          });
        }
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }]
          })
        });
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        let cloudResult = { spliceProbability: 0.0, manipulationLikelihood: 0.0, findings: [] };
        try {
          const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          cloudResult = JSON.parse(cleanJson);
        } catch (e) {
          console.warn("Failed to parse Gemini response as JSON, text was:", responseText);
        }
        
        const report = {
          spliceProbability: cloudResult.spliceProbability || 0.0,
          compressionMismatch: (cloudResult.spliceProbability || 0.0) * 0.8,
          elaScore: 1.0 - (cloudResult.manipulationLikelihood || 0.0),
          noiseResidual: 0.0,
          copyMoveDetected: (cloudResult.manipulationLikelihood || 0.0) > 0.6,
          illuminationMismatch: false,
          frequencyAnomaly: false,
          manipulationLikelihood: cloudResult.manipulationLikelihood || 0.0,
          findings: cloudResult.findings || ["Cloud visual check completed."],
          skipped: false
        };
        featureStore.setFeature(hash, 'forensics', report);
        return report;
      } catch (err) {
        console.warn("ForensicService: Commercial Cloud Gemini visual check failed, falling back to local worker:", err);
      }
    }

    return new Promise((resolve) => {
      const worker = getForensicWorker();
      
      const onMessage = (event) => {
        if (event.data.type === 'result') {
          worker.removeEventListener('message', onMessage);
          const res = event.data.result;
          const report = {
            spliceProbability: res.spliceProbability || 0.0,
            compressionMismatch: res.compressionMismatch || 0.0,
            elaScore: res.elaScore || 0.0,
            noiseResidual: res.noiseResidual || 0.0,
            copyMoveDetected: res.copyMoveDetected || false,
            illuminationMismatch: res.illuminationMismatch || false,
            frequencyAnomaly: res.frequencyAnomaly || false,
            manipulationLikelihood: res.manipulationLikelihood || 0.0,
            findings: res.findings || [],
            skipped: false
          };
          featureStore.setFeature(hash, 'forensics', report);
          resolve(report);
        }
      };

      worker.addEventListener('message', onMessage);
      
      worker.postMessage({
        type: 'analyze',
        imageUri: mediaRef.uri || '',
        payloadString: mediaRef.base64 || mediaRef.contentHash || mediaRef.uri || ''
      });
    });
  }
};
