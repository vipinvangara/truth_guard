/**
 * Truth Guard Calibration Service
 * Calibrates authenticity scores using temperature scaling and agreement normalization
 * based on contradictions severity.
 */

export const CalibrationService = {
  
  /**
   * Run calibration logic
   * @param {number} rawScore - Aggregated score (0.0 to 1.0)
   * @param {number} uncertainty - Uncertainty (0.0 to 1.0)
   * @param {Array} contradictions - List of Contradiction objects
   * @returns {Object} Calibrated score and uncertainty
   */
  calibrate(rawScore, uncertainty, contradictions) {
    let score = rawScore;
    let calibratedUncertainty = uncertainty;

    // 1. Contradiction Penalty Scaling
    if (contradictions && contradictions.length > 0) {
      const highSevCount = contradictions.filter(c => c.severity === 'high').length;
      const medSevCount = contradictions.filter(c => c.severity === 'medium').length;

      // Penalize the score and increase uncertainty if logical contradictions are present
      const penalty = (highSevCount * 0.15) + (medSevCount * 0.05);
      score = Math.max(0.02, score - penalty);
      calibratedUncertainty = Math.min(0.98, calibratedUncertainty + (highSevCount * 0.10) + (medSevCount * 0.03));
    }

    // 2. Temperature Scaling (logistic smoothing to prevent extreme 0.0 or 1.0 valuations when uncertainty is high)
    if (calibratedUncertainty > 0.40) {
      const temperature = 1.5; // High entropy smooth
      const logit = Math.log(score / (1 - score + 1e-6));
      const smoothedLogit = logit / temperature;
      score = 1 / (1 + Math.exp(-smoothedLogit));
    }

    // Rounding coordinates for clean outputs
    return {
      score: parseFloat(score.toFixed(3)),
      uncertainty: parseFloat(calibratedUncertainty.toFixed(3))
    };
  }
};
