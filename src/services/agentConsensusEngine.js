// src/services/agentConsensusEngine.js
// Resolves agreements/contradictions between independent agents after normalization and weighting

import { AgentReliabilityEngine } from './agentReliabilityEngine';

export const AgentConsensusEngine = {
  /**
   * Normalize and resolve consensus across independent modalities
   * @param {Object} agentOutputs - Modality outputs (e.g. { ocr: { score, passed }, vlm: { score }, metadata: { score } })
   * @returns {Object} Normalized consensus results containing weighted score and disagreements list
   */
  resolveConsensus(agentOutputs) {
    const rawScores = {};
    const details = {};

    // 1. Extract raw scores (defaulting to 1.0 pass, 0.1 fail, or numerical score)
    Object.entries(agentOutputs || {}).forEach(([modality, val]) => {
      if (val === null || val === undefined) return;
      let score = 1.0;
      if (typeof val === 'number') {
        score = val;
      } else if (val.score !== undefined) {
        score = val.score;
      } else if (val.passed !== undefined) {
        score = val.passed ? 1.0 : 0.15;
      } else if (val.status !== undefined) {
        score = val.status === 'verified' ? 1.0 : (val.status === 'tampered' ? 0.10 : 0.60);
      }
      rawScores[modality] = score;
      details[modality] = val;
    });

    // 2. Apply reliability weighting
    const weightedScores = AgentReliabilityEngine.applyReliabilityWeights(rawScores);

    // 3. Compute weighted average consensus score
    let weightedSum = 0;
    let weightSum = 0;

    Object.entries(weightedScores).forEach(([modality, weightedScore]) => {
      const w = AgentReliabilityEngine.weights[modality] || 0.50;
      weightedSum += weightedScore;
      weightSum += w;
    });

    const consensusScore = weightSum > 0 ? parseFloat((weightedSum / weightSum).toFixed(2)) : 0.50;

    // 4. Identify modal disagreements (Contradictions)
    const disagreements = [];
    const modalities = Object.keys(rawScores);

    for (let i = 0; i < modalities.length; i++) {
      for (let j = i + 1; j < modalities.length; j++) {
        const modA = modalities[i];
        const modB = modalities[j];
        const scoreA = rawScores[modA];
        const scoreB = rawScores[modB];

        // High deviation indicates contradiction (e.g. Metadata says completely fake, VLM says completely real)
        if (Math.abs(scoreA - scoreB) > 0.60) {
          disagreements.push({
            modalityA: modA,
            modalityB: modB,
            scoreA,
            scoreB,
            description: `Agent conflict: ${modA.toUpperCase()} reports score of ${scoreA.toFixed(2)}, but ${modB.toUpperCase()} reports ${scoreB.toFixed(2)}.`
          });
        }
      }
    }

    return {
      success: true,
      consensusScore,
      weightedScores,
      disagreements,
      rawScores
    };
  }
};
