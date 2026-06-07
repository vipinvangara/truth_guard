/**
 * Truth Guard OCR & Claim Reasoning Service
 * Identifies and classifies factual assertions, opinions, advertisements,
 * or satire from text, mapping confidence indices.
 */

import { getOcrWorker } from '../workers/ocrWorker';
import { featureStore } from './featureStore';

export const ClaimReasoningService = {
  
  /**
   * Run Claim extraction and classification
   * @param {string} text - OCR text or direct raw input
   * @param {string} assetHash
   * @returns {Promise<Object>} claims report
   */
  async process(text, assetHash) {
    if (!text || !text.trim()) {
      return { claims: [], confidence: 1.0 };
    }

    // Check feature store
    const cached = featureStore.getFeature(assetHash, 'claims');
    if (cached) return cached;

    return new Promise((resolve) => {
      const worker = getOcrWorker();
      
      const onMessage = (event) => {
        if (event.data.type === 'result') {
          worker.removeEventListener('message', onMessage);
          const res = event.data.result;
          const report = {
            claims: res.claims || [],
            confidence: res.confidence || 0.70
          };
          featureStore.setFeature(assetHash, 'claims', report);
          resolve(report);
        }
      };

      worker.addEventListener('message', onMessage);
      
      worker.postMessage({
        type: 'process',
        text
      });
    });
  }
};
