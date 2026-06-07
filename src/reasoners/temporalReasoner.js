// src/reasoners/temporalReasoner.js
// Evaluates era chronology, lifespan boundaries, and timeline consistency

export const TemporalReasoner = {
  /**
   * Run temporal consistency checks
   * @param {Array} claims - List of atomic claims
   * @param {Object} mediaRef - Input media metadata
   * @param {Object} perceptionState - Fused PerceptionState
   * @returns {Object} Findings and score
   */
  check(claims = [], mediaRef = {}, perceptionState = {}) {
    const findings = [];
    let score = 1.0;

    const claimsText = claims.map(c => (c.text || '').toLowerCase()).join(' ');
    const scene = (perceptionState.sceneDescription || '').toLowerCase();

    // Chronological context checks
    if (claimsText.includes('emergency') && (scene.includes('archive') || claimsText.includes('archive video'))) {
      findings.push({
        type: "temporal_era_mismatch",
        description: "Timeline violation: Ingested visual frames represent historical archive stock footage, but claim text asserts modern real-time emergency.",
        severity: "high"
      });
      score = 0.30;
    }

    return {
      success: true,
      findings,
      score
    };
  }
};
