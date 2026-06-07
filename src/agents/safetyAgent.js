/**
 * Truth Guard Safety Agent
 * Evaluates adversarial guard checks, stegano indicators, and injection logs.
 */

export const SafetyAgent = {
  
  /**
   * Run agent evaluation
   * @param {Object} report
   * @returns {Object} agent decision
   */
  evaluate(report) {
    let score = 0.90;
    let uncertainty = 0.10;
    let coverage = 0.80;
    let findings = [];

    // Analyze anomalies list
    const observations = report.observations || [];
    const promptInjectionObs = observations.find(o => o.type === 'adversarial-alert');
    
    if (promptInjectionObs) {
      score = 0.15;
      uncertainty = 0.08;
      findings.push("Adversarial payload or instructions injection detected in text.");
    }

    return {
      agentId: "safety-agent",
      score,
      uncertainty,
      coverage,
      findings
    };
  }
};
