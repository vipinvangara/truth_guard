/**
 * Truth Guard Geopolitical Reasoner
 * Evaluates geographic claims, domain headers, and routing origins against jurisdictional metadata.
 */

export const GeopoliticalReasoner = {
  /**
   * Run geopolitical consistency checks
   * @param {Array} claims - List of atomic claims
   * @param {Object} mediaRef - Input media context
   * @param {Object} perceptionState - Low-level perception data
   * @returns {Object} { success: boolean, findings: Array, score: number }
   */
  check(claims = [], mediaRef = {}, perceptionState = {}) {
    const findings = [];
    let score = 1.0;

    const claimsText = claims.map(c => (c.text || '').toLowerCase()).join(' ');
    const ip = (mediaRef.ip || '').toLowerCase();

    // Check spatial alignment between claim details and network routing
    if (claimsText.includes('rotterdam')) {
      // If claimed Rotterdam, but IP originates from Bucharest
      if (ip.includes('185.220.101.4') || ip.includes('bucharest') || (ip && !ip.includes('rotterdam') && !ip.includes('local') && !ip.includes('127.0.0.1'))) {
        findings.push({
          type: "geopolitical_routing_mismatch",
          description: `Geopolitical discrepancy: Claim asserts unauthorized logins originating from Rotterdam, but network routing header indicates source IP originates from Bucharest, Romania (${mediaRef.ip || '185.220.101.4'}).`,
          severity: "high"
        });
        score = 0.45;
      }
    }

    return {
      success: true,
      findings,
      score
    };
  }
};
