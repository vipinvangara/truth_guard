/**
 * Truth Guard Contextual Reasoner Orchestrator
 * Coordinates physical, biological, temporal, historical, and geopolitical reasoning.
 */

import { EpistemicValidationEngine } from '../reasoners/epistemicValidationEngine';
import { GeopoliticalReasoner } from '../reasoners/geopoliticalReasoner';
import { PhysicalReasoner } from '../reasoners/physicalReasoner';
import { BiologicalReasoner } from '../reasoners/biologicalReasoner';
import { TemporalReasoner } from '../reasoners/temporalReasoner';

export const ContextualReasoner = {
  /**
   * Run all contextual reasoners on claims and mediaRef
   * @param {Object} claimGraph - Structured claim graph
   * @param {Object} mediaRef - Raw media context
   * @param {Object} perceptionState - Raw perception state for low-level features
   * @returns {Object} aggregated plausibility and contradictions list
   */
  async reason(claimGraph = {}, mediaRef = {}, perceptionState = {}) {
    const claims = claimGraph.claims || [];
    const contradictions = [];
    let cumulativeScore = 0;
    let activeReasonersCount = 0;

    const runReasoner = async (reasoner, name, stateOverride = null) => {
      try {
        const result = await reasoner.check(claims, mediaRef, stateOverride || perceptionState);
        if (result && result.success) {
          if (result.findings && result.findings.length > 0) {
            result.findings.forEach(f => {
              contradictions.push({
                type: f.type || `${name}_mismatch`,
                description: f.description,
                severity: f.severity || 'medium'
              });
            });
          }
          cumulativeScore += result.score !== undefined ? result.score : 1.0;
          activeReasonersCount++;
        }
      } catch (err) {
        console.warn(`Reasoner ${name} execution failed:`, err);
      }
    };

    // Extract date markers & calculate delta against 2026
    const claimsText = claims.map(c => typeof c === 'string' ? c : (c.text || '')).join(' ');
    const yearRegex = /\b(1[7-9]\d{2}|20[0-2]\d)\b/g;
    let isHistorical = false;
    let match;
    while ((match = yearRegex.exec(claimsText)) !== null) {
      const year = parseInt(match[1]);
      const delta = 2026 - year;
      if (delta > 5) {
        isHistorical = true;
      }
    }

    const evidenceResult = perceptionState.evidenceResult;
    if (isHistorical && evidenceResult) {
      if (evidenceResult.retrievalMetrics) {
        evidenceResult.retrievalMetrics.recencyScore = 1.0;
      }
      const allEvidence = [...(evidenceResult.supportingEvidence || []), ...(evidenceResult.contradictingEvidence || [])];
      allEvidence.forEach(item => {
        item.recency = 1.0;
      });
    }

    // Run each reasoner
    const snippets = [
      ...(perceptionState.evidenceResult?.supportingEvidence || []),
      ...(perceptionState.evidenceResult?.contradictingEvidence || [])
    ];
    const epistemicState = { 
      ...perceptionState, 
      snippets,
      executionMode: perceptionState.executionMode,
      geminiApiKey: perceptionState.geminiApiKey
    };

    await runReasoner(EpistemicValidationEngine, 'historical', epistemicState);
    await runReasoner(GeopoliticalReasoner, 'geopolitical');
    await runReasoner(PhysicalReasoner, 'physical');
    await runReasoner(BiologicalReasoner, 'biological');
    await runReasoner(TemporalReasoner, 'temporal');

    const overallScore = activeReasonersCount > 0 ? parseFloat((cumulativeScore / activeReasonersCount).toFixed(2)) : 1.0;
    
    // Confidence decreases with the number of severe contradictions
    const highContradictionsCount = contradictions.filter(c => c.severity === 'high').length;
    const confidence = Math.max(0.40, parseFloat((0.95 - highContradictionsCount * 0.25).toFixed(2)));

    return {
      plausibility: {
        score: overallScore,
        confidence
      },
      contradictions
    };
  }
};
