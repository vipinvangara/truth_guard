// src/services/agentReliabilityEngine.js
// Handles modality reliability mappings and applies weighted indices to modal findings

export const AgentReliabilityEngine = {
  // Configured default agent reliability weights
  weights: {
    ocr: 0.91,
    vlm: 0.63,
    metadata: 0.97,
    objects: 0.85,
    regions: 0.72
  },

  /**
   * Resolve weighted score based on modality reliability index
   * @param {string} modality - Modal identifier
   * @param {number} rawScore - Raw score from agent (0.0 to 1.0)
   * @returns {number} Weighted score
   */
  getWeightedScore(modality, rawScore) {
    const cleanModality = (modality || '').toLowerCase();
    const weight = this.weights[cleanModality] !== undefined ? this.weights[cleanModality] : 0.50;
    return rawScore * weight;
  },

  /**
   * Apply reliability weight normalization over a list of agent scores
   * @param {Object} agentScores - Modality -> score mapping
   * @returns {Object} Weighted agent score mapping
   */
  applyReliabilityWeights(agentScores) {
    const weighted = {};
    Object.entries(agentScores).forEach(([modality, score]) => {
      weighted[modality] = this.getWeightedScore(modality, score);
    });
    return weighted;
  }
};
