// src/services/calibrationEngine.js
// Propagates graph-wide uncertainty and dynamically applies Platt Scaling, Isotonic Regression, or Temperature Scaling calibration curves

export const CalibrationEngine = {
  /**
   * Run dynamic calibration over raw verification score
   * @param {number} rawScore - Raw consensus score (0.0 to 1.0)
   * @param {Object} uncertaintyMatrix - Modality uncertainties from PerceptionState
   * @param {number} claimsCount - Total claims analyzed (sample size indicator)
   * @param {Object} retrievalMetrics - Evidence retrieval metrics
   * @returns {Object} Calibrated trust score and propagated uncertainty parameters
   */
  calibrate(rawScore, uncertaintyMatrix, claimsCount = 1, retrievalMetrics = {}) {
    const u = uncertaintyMatrix || {};

    // 1. Modality Uncertainty (Weighted sum of sensory inputs)
    const weights = { vlm: 0.35, objects: 0.15, ocr: 0.20, provenance: 0.30 };
    let totalWeight = 0;
    let weightedUncertainty = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      if (u[key] !== undefined) {
        weightedUncertainty += u[key] * weight;
        totalWeight += weight;
      }
    });
    const modalUncertainty = totalWeight > 0 ? (weightedUncertainty / totalWeight) : 0.15;

    // 2. Claim Extraction Uncertainty (Sample density metric)
    const claimUncertainty = claimsCount > 0 ? parseFloat((0.08 / Math.sqrt(claimsCount)).toFixed(3)) : 0.40;

    // 3. Verification Retrieval Uncertainty (1 - average reliability/recency of sources)
    const rel = retrievalMetrics.reliability !== undefined ? retrievalMetrics.reliability : 0.85;
    const rec = retrievalMetrics.recency !== undefined ? retrievalMetrics.recency : 0.90;
    const retrievalUncertainty = parseFloat((1 - (rel * rec)).toFixed(3));

    // 4. Propagated Uncertainty (Root-Mean-Square propagation through the reasoning graph)
    const propagatedUncertainty = parseFloat(
      Math.sqrt(
        (modalUncertainty * modalUncertainty + 
         claimUncertainty * claimUncertainty + 
         retrievalUncertainty * retrievalUncertainty) / 3
      ).toFixed(2)
    );

    // 5. Select Calibration Algorithm Dynamically
    let calibratedScore = rawScore;
    let selectedMethod = "Temperature Scaling";

    if (claimsCount <= 2) {
      // Platt Scaling (Sigmoid probability calibration optimal for low sample counts)
      selectedMethod = "Platt Scaling";
      const A = -2.4; // Platt parameter
      const B = 0.2;  // Platt parameter
      calibratedScore = 1 / (1 + Math.exp(A * rawScore + B));
    } else if (rawScore < 0.40 || rawScore > 0.80) {
      // Isotonic Regression (Stepwise isotonic binning mapping for edge cases)
      selectedMethod = "Isotonic Regression";
      if (rawScore < 0.20) calibratedScore = 0.05;
      else if (rawScore < 0.40) calibratedScore = 0.25;
      else if (rawScore < 0.85) calibratedScore = 0.70;
      else calibratedScore = 0.96;
    } else {
      // Temperature Scaling (Logit rescaler)
      selectedMethod = "Temperature Scaling";
      const T = 1.35; // Temperature parameter
      const logit = Math.log(Math.max(0.01, Math.min(0.99, rawScore)) / (1 - Math.max(0.01, Math.min(0.99, rawScore))));
      const scaledLogit = logit / T;
      calibratedScore = 1 / (1 + Math.exp(-scaledLogit));
    }

    // Apply uncertainty penalty bounds
    if (propagatedUncertainty > 0.28) {
      calibratedScore *= (1 - (propagatedUncertainty - 0.28));
    }

    // Final clean mapping
    calibratedScore = parseFloat(Math.max(0.01, Math.min(0.99, calibratedScore)).toFixed(2));
    const confidence = parseFloat((1 - propagatedUncertainty).toFixed(2));

    return {
      score: calibratedScore,
      uncertainty: propagatedUncertainty,
      confidence,
      selectedMethod,
      diagnostics: {
        modalUncertainty,
        claimUncertainty,
        retrievalUncertainty
      }
    };
  }
};
