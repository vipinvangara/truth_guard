// src/services/analysisLimitations.js
// Identifies and logs evaluation constraints and pipeline failure modes (e.g. low-res, heavy compression)

export const AnalysisLimitations = {
  /**
   * Evaluate the pipeline state to list diagnostic limitations
   * @param {Object} perceptionState - Fused PerceptionState
   * @param {Object} forensics - forensicWorker results
   * @param {Object} provenance - provenanceWorker results
   * @returns {Array<string>} List of identified limitations/failure modes
   */
  evaluateLimitations(perceptionState, forensics, provenance) {
    const limitations = [];

    const u = perceptionState.uncertainty || {};
    const comp = forensics.compressionMismatch || 0;
    const provConf = provenance.provenanceConfidence || 0;

    // 1. Heavy Image Compression Limit
    if (comp > 0.50) {
      limitations.push("Extreme JPEG compression: Double quantizations impede deep-pixel verification.");
    }

    // 2. OCR OCR Text Readability Limit
    if (u.ocr > 0.40) {
      limitations.push("Low-contrast textual content: OCR character confidence is below optimal threshold.");
    }

    // 3. Provenance Header Limit
    if (provConf < 0.40) {
      limitations.push("Insufficient provenance: Metadata headers lack cryptographic validator signatures.");
    }

    // 4. Low Resolution Limit
    if (perceptionState.objects && perceptionState.objects.length <= 1 && u.vlm > 0.30) {
      limitations.push("Limited visual signal: Ingested media has low resolution or missing subject boundaries.");
    }

    // 5. Baseline Fallback Warnings
    if (limitations.length === 0) {
      limitations.push("Evaluation bounds: Diagnostics calibrated against local schema constraints.");
    }

    return limitations;
  }
};
