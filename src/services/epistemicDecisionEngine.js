/**
 * Truth Guard Epistemic Decision Engine
 * Computes non-binary, calibrated, probabilistic assessments across multiple dimensions.
 * Decouples cryptographic provenance chain integrity from contextual truthfulness.
 */

export const EpistemicDecisionEngine = {
  /**
   * Resolve joint probabilistic assessments
   * @param {Object} forensicsResult - Pixel level forensics
   * @param {Object} provenanceResult - Cryptographic metadata checks
   * @param {Object} contextualResult - Contextual plausibility & contradictions
   * @param {Object} evidenceResult - Supporting/contradicting evidence & metrics
   * @param {Object} narrativeResult - Propaganda and framing indicators
   * @returns {Object} Multidimensional calibrated scores
   */
  evaluate(forensicsResult = {}, provenanceResult = {}, contextualResult = {}, evidenceResult = {}, narrativeResult = {}, type = null) {
    const forensicsScore = forensicsResult.manipulationLikelihood || 0.08;
    const provenanceStatus = provenanceResult.status || 'unknown';
    
    const plausibility = (contextualResult.plausibility || { score: 1.0, confidence: 0.90 });
    const contradictions = contextualResult.contradictions || [];

    const metrics = (evidenceResult.retrievalMetrics || { sourceReliability: 0.85, agreementCoefficient: 0.95, recencyScore: 0.90 });
    const narrativeRisk = (narrativeResult.narrativeRisk || { propagandaLikelihood: 0.05, emotionalManipulation: 0.05, framingRisk: 0.10 });

    // 1. Decoupled Provenance Verification (Proves source chain, not semantic truth)
    let provenanceConfidence = 0.50;
    if (provenanceStatus === 'verified') {
      provenanceConfidence = 0.98;
    } else if (provenanceStatus === 'tampered') {
      provenanceConfidence = 0.05;
    }

    const provenance = {
      status: provenanceStatus,
      confidence: provenanceConfidence
    };

    // 3. Contextual Reliability (semantic truth and factual consistency)
    // Decreases heavily if contradictions exist
    const isUnknownContext = evidenceResult.state === 'UNKNOWN_CONTEXT' || evidenceResult.status === 'UNKNOWN_CONTEXT';
    let contextualReliabilityScore = plausibility.score;
    if (isUnknownContext) {
      contextualReliabilityScore = 0.50;
    } else if (contradictions.length > 0) {
      const avgSeverity = contradictions.reduce((sum, c) => sum + (c.severity === 'high' ? 0.45 : 0.20), 0);
      contextualReliabilityScore = Math.max(0.10, parseFloat((plausibility.score - avgSeverity).toFixed(2)));
    }

    if (isUnknownContext) {
      contextualReliabilityScore = 0.50;
    } else {
      contextualReliabilityScore = parseFloat(
        (0.60 * contextualReliabilityScore + 0.40 * metrics.agreementCoefficient).toFixed(2)
      );
    }

    // 2. Physical/Semantic Authenticity Score (physical integrity for media, factual truth for text claims)
    let authenticityScore = parseFloat((1.0 - forensicsScore).toFixed(2));
    if (type === 'Text') {
      // For raw text claims, decouple from physical forensics and map directly to contextual/factual truthfulness
      authenticityScore = contextualReliabilityScore;
    }
    let authenticityConfidence = parseFloat(Math.min(0.98, Math.max(0.50, plausibility.confidence)).toFixed(2));
    if (isUnknownContext) {
      authenticityConfidence = 0.50;
    }

    // 4. Misinformation Likelihood
    let misinformationScore = parseFloat((1.0 - contextualReliabilityScore).toFixed(2));
    if (contradictions.length > 0) {
      misinformationScore = parseFloat(Math.min(0.99, Math.max(misinformationScore, 0.70)).toFixed(2));
    }

    // 5. Manipulation Likelihood (pixel-level edits)
    const manipulationScore = parseFloat(Math.max(0.0, 1.0 - authenticityScore).toFixed(2));

    // 6. Propaganda Likelihood (framing risk)
    const propagandaScore = parseFloat(narrativeRisk.propagandaLikelihood.toFixed(2));

    // 7. Evidence Strength
    const evidenceStrengthScore = parseFloat(
      ((metrics.sourceReliability + metrics.agreementCoefficient + metrics.recencyScore) / 3).toFixed(2)
    );

    // 8. Uncertainty Score (calibration inverse)
    const uncertaintyScore = parseFloat((1.0 - authenticityConfidence).toFixed(2));

    return {
      provenance,
      authenticity: {
        score: authenticityScore,
        confidence: authenticityConfidence
      },
      contextualReliability: {
        score: contextualReliabilityScore
      },
      manipulationLikelihood: {
        score: manipulationScore
      },
      misinformationLikelihood: {
        score: misinformationScore
      },
      propagandaLikelihood: {
        score: propagandaScore
      },
      evidenceStrength: {
        score: evidenceStrengthScore
      },
      uncertainty: {
        score: uncertaintyScore
      }
    };
  }
};
export default EpistemicDecisionEngine;
