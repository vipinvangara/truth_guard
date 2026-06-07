/**
 * Truth Guard Multi-Agent Consensus Engine
 * Coordinates evaluations from Metadata, Visual, Claim, Provenance, and Safety agents.
 * Runs weighted aggregation and captures disagreement markers.
 */

import { MetadataAgent } from './metadataAgent';
import { VisualAgent } from './visualAgent';
import { ClaimAgent } from './claimAgent';
import { ProvenanceAgent } from './provenanceAgent';
import { SafetyAgent } from './safetyAgent';

export const ConsensusEngine = {
  
  /**
   * Run agent consensus coordination
   * @param {Object} report - Current progressive report
   * @param {boolean} consensusAuthorized - User sandbox permission configuration
   * @returns {Promise<Object>} consensus results
   */
  async evaluate(report, consensusAuthorized) {
    // 1. Gather individual agent outputs
    const metaOutput = MetadataAgent.evaluate(report);
    const visualOutput = VisualAgent.evaluate(report);
    const claimOutput = ClaimAgent.evaluate(report);
    const provOutput = ProvenanceAgent.evaluate(report);
    const safetyOutput = SafetyAgent.evaluate(report);

    const agents = [metaOutput, visualOutput, claimOutput, provOutput, safetyOutput];

    // 2. Resolve agent weights based on coverage & relevance
    let totalWeight = 0;
    let weightedScoreSum = 0;
    let weightedUncertaintySum = 0;
    const disagreements = [];

    // Weight allocations: Metadata (0.25), Visual (0.25), Claim (0.15), Provenance (0.25), Safety (0.10)
    const baseWeights = {
      "metadata-agent": 0.25,
      "visual-agent": 0.25,
      "claim-agent": 0.15,
      "provenance-agent": 0.25,
      "safety-agent": 0.10
    };

    agents.forEach(agent => {
      const baseWeight = baseWeights[agent.agentId] || 0.10;
      const weight = baseWeight * agent.coverage;
      totalWeight += weight;
      weightedScoreSum += agent.score * weight;
      weightedUncertaintySum += agent.uncertainty * weight;
    });

    const consensusScore = totalWeight > 0 ? (weightedScoreSum / totalWeight) : 0.50;
    const consensusUncertainty = totalWeight > 0 ? (weightedUncertaintySum / totalWeight) : 0.50;

    // 3. Track severe agent disagreements (e.g. visual vs metadata score difference > 0.5)
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const diff = Math.abs(agents[i].score - agents[j].score);
        if (diff > 0.50) {
          disagreements.push({
            agents: [agents[i].agentId, agents[j].agentId],
            scoreDifference: diff,
            description: `Agent ${agents[i].agentId} and Agent ${agents[j].agentId} report high divergence in authenticity assessments.`
          });
        }
      }
    }

    return {
      score: consensusScore,
      uncertainty: consensusUncertainty,
      agentReports: agents,
      disagreements
    };
  }
};
