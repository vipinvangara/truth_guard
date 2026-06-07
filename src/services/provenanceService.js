/**
 * Truth Guard Provenance Service
 * Runs strict local metadata validations and delegates network fact-check
 * retrieval lookups to the evidence retriever when consensus mode is enabled.
 */

import { getProvenanceWorker } from '../workers/provenanceWorker';
import { EvidenceRetrieverService } from './evidenceRetriever';

export const ProvenanceService = {
  
  /**
   * Assess local file provenance status
   * @param {Object} mediaRef
   * @returns {Promise<Object>} local provenance status
   */
  async checkLocalProvenance(mediaRef) {
    return new Promise((resolve) => {
      const worker = getProvenanceWorker();
      
      const onMessage = (event) => {
        if (event.data.type === 'result') {
          worker.removeEventListener('message', onMessage);
          resolve(event.data.result);
        }
      };

      worker.addEventListener('message', onMessage);
      
      worker.postMessage({
        type: 'verify',
        mediaRef,
        payloadString: mediaRef.base64 || mediaRef.contentHash || mediaRef.uri || ''
      });
    });
  },

  /**
   * Retrieve external facts when consensus checks are authorized
   * @param {Object} report
   * @param {string} mode - "LOCAL_ONLY" | "PRIVATE_CONSENSUS" | "OPEN_WEB"
   * @returns {Promise<Array>} List of references
   */
  async retrieveExternalEvidence(report, mode) {
    if (mode === 'LOCAL_ONLY') return [];
    
    // Delegate to retriever service
    return EvidenceRetrieverService.retrieve(report, mode);
  }
};
