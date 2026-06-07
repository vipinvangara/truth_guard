/**
 * Truth Guard Contradiction Engine
 * Preserves, aggregates, and prioritizes detected contradictions across
 * analysis runs, forming the logical explanation backbone.
 */

export const ContradictionEngine = {
  
  /**
   * Sort contradictions by severity index
   * @param {Array} contradictions - List of contradictions
   * @returns {Array} sorted list
   */
  prioritize(contradictions) {
    const severityWeights = { high: 3, medium: 2, low: 1 };
    return [...contradictions].sort((a, b) => {
      const weightA = severityWeights[a.severity] || 0;
      const weightB = severityWeights[b.severity] || 0;
      return weightB - weightA;
    });
  },

  /**
   * Check if severe contradictions exist
   * @param {Array} contradictions
   * @returns {boolean}
   */
  hasCriticalFailures(contradictions) {
    return contradictions.some(c => c.severity === 'high');
  }
};
