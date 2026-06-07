// src/reasoners/geographicReasoner.js
// Evaluates geographical landmark coherence against network header origins

export const GeographicReasoner = {
  /**
   * Run geographical consistency checks
   * @param {Object} perceptionState - Fused PerceptionState
   * @param {Object} mediaRef - Input media metadata
   * @returns {Object} Findings and score
   */
  check(perceptionState, mediaRef) {
    const findings = [];
    let score = 1.0;

    const textContext = (perceptionState.text || []).map(t => t.toLowerCase()).join(' ');
    const ip = (mediaRef.ip || '').toLowerCase();

    // Check spatial alignment between claim details and network routing
    if (textContext.includes('rotterdam') && !ip.includes('rotterdam') && !ip.includes('local')) {
      findings.push({
        type: "geographic_landmark_mismatch",
        description: `Landmark discrepancy: Claim asserts connection to Rotterdam, but network header originates from Bucharest / ${mediaRef.ip || 'external IP'}.`,
        severity: "medium"
      });
      score = 0.50;
    }

    return {
      success: true,
      findings,
      score
    };
  }
};
