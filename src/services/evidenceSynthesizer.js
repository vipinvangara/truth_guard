// src/services/evidenceSynthesizer.js
// Aggregates gathered references, using double-sided support/contradict lists to calculate consensus ratings

export const EvidenceSynthesizer = {
  /**
   * Synthesize evidence nodes against claim details
   * @param {Array} claims
   * @param {Object|Array} evidenceResult - Supporting and contradicting list objects
   * @returns {Object} support, contradict, consensusScore
   */
  synthesize(claims, evidenceResult) {
    let support = [];
    let contradict = [];
    let consensusScore = 0.50; // Neutral baseline

    if (evidenceResult && !Array.isArray(evidenceResult)) {
      // Support double-sided evidence result
      support = evidenceResult.supporting || [];
      contradict = evidenceResult.contradicting || [];
    } else if (Array.isArray(evidenceResult)) {
      // Fallback for arrays
      evidenceResult.forEach(ref => {
        const summary = (ref.summary || '').toLowerCase();
        if (
          summary.includes('never') || 
          summary.includes('violation') ||
          summary.includes('contradict') ||
          summary.includes('mismatch') ||
          summary.includes('unaffected') ||
          summary.includes('grace period')
        ) {
          contradict.push(ref);
        } else {
          support.push(ref);
        }
      });
    }

    if (contradict.length > 0) {
      // Use reliability and agreement of contradicting evidence to subtract score
      const totalContradictPenalty = contradict.reduce((acc, c) => acc + (c.reliability || 0.80) * (c.agreement || 0.80), 0);
      consensusScore = Math.max(0.01, 0.50 - (totalContradictPenalty * 0.22));
    } else if (support.length > 0) {
      // Use reliability and agreement of supporting evidence to add score
      const totalSupportBonus = support.reduce((acc, s) => acc + (s.reliability || 0.80) * (s.agreement || 0.80), 0);
      consensusScore = Math.min(0.99, 0.50 + (totalSupportBonus * 0.16));
    }

    return {
      support,
      contradict,
      consensusScore
    };
  }
};
