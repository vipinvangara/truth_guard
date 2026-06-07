// src/services/worldConsistencyEngine.js
// Aggregates evaluations from split modular reasoners (temporal, geographic, physical, biological)

import { TemporalReasoner } from '../reasoners/temporalReasoner';
import { GeographicReasoner } from '../reasoners/geographicReasoner';
import { PhysicalReasoner } from '../reasoners/physicalReasoner';
import { BiologicalReasoner } from '../reasoners/biologicalReasoner';

export const WorldConsistencyEngine = {
  /**
   * Run consistency verification checks by delegating to modular reasoners
   * @param {Object} perceptionState - Fused PerceptionState
   * @param {Object} mediaRef - Input media metadata
   * @returns {Object} Consistency analysis report containing scores and reasoning
   */
  verifyConsistency(perceptionState, mediaRef) {
    const temporalResult = TemporalReasoner.check(perceptionState, mediaRef);
    const geographicResult = GeographicReasoner.check(perceptionState, mediaRef);
    const physicalResult = PhysicalReasoner.check(perceptionState, mediaRef);
    const biologicalResult = BiologicalReasoner.check(perceptionState, mediaRef);

    const findings = [
      ...(temporalResult.findings || []),
      ...(geographicResult.findings || []),
      ...(physicalResult.findings || []),
      ...(biologicalResult.findings || [])
    ];

    const overallScore = parseFloat(
      ((temporalResult.score + geographicResult.score + physicalResult.score + biologicalResult.score) / 4).toFixed(2)
    );

    return {
      success: true,
      findings,
      scores: {
        temporal: temporalResult.score,
        geographic: geographicResult.score,
        physical: physicalResult.score,
        biological: biologicalResult.score
      },
      overallScore
    };
  }
};
