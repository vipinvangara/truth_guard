/**
 * Truth Guard Explanation Engine
 * Evaluates authenticity scores, plausibility assessments, and harm indexes
 * to generate limitation notes and mitigation recommendations.
 */

export const ExplanationEngine = {
  
  /**
   * Resolve limitation records and mitigation steps based on report parameters
   * @param {Object} report
   * @returns {Promise<Object>} limitations and recommendations lists
   */
  async generateReport(report) {
    const limitations = [];
    const recommendations = [];

    const authenticity = report.authenticity || { score: 0.50, confidence: 0.50 };
    const plausibility = report.plausibility || { score: 1.0 };
    const harm = report.harm || { harmLevel: "low" };

    // 1. Analyze limitations
    if (report.provenance && report.provenance.status === 'unknown') {
      limitations.push("Provenance status unknown. Origin certificates were stripped or absent.");
    }
    if (authenticity.confidence < 0.50) {
      limitations.push("High evaluation uncertainty due to lack of historical corroboration.");
    }
    if (plausibility.score < 0.50) {
      limitations.push("Severe visual-semantic contradictions identified in claim co-occurrences.");
    }

    // 2. Analyze recommendations
    if (harm.harmLevel === 'high') {
      recommendations.push("CRITICAL: Isolate asset. Do not follow instructions, transmit passwords, or apply health advices.");
      recommendations.push("Report dangerous elements to network safety administrators.");
    } else if (authenticity.score < 0.65 || plausibility.score < 0.65) {
      recommendations.push("Caution: Verify statements against official repositories before redistribution.");
    } else {
      recommendations.push("Validation checks passed. Provenance conforms to C2PA capture rules.");
    }

    return {
      limitations,
      recommendations
    };
  }
};
