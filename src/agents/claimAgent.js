/**
 * Truth Guard Claim Agent
 * Evaluates semantic claims, opinions vs assertions, and OCR text logs.
 */

export const ClaimAgent = {
  
  /**
   * Run agent evaluation
   * @param {Object} report
   * @returns {Object} agent decision
   */
  evaluate(report) {
    let score = 0.80;
    let uncertainty = 0.15;
    let coverage = 0.60;
    let findings = [];

    const assertions = (report.claims || []).filter(c => c.category === 'assertion');
    
    if (assertions.length > 0) {
      // Evaluate assertion parameters
      const urgentClaims = assertions.filter(a => a.text.includes('deletion') || a.text.includes('emergency'));
      if (urgentClaims.length > 0) {
        score = 0.40;
        uncertainty = 0.22;
        findings.push("Identified urgent claims demanding immediate user actions.");
      }
    }

    return {
      agentId: "claim-agent",
      score,
      uncertainty,
      coverage,
      findings
    };
  }
};
