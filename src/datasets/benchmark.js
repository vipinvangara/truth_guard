// src/datasets/benchmark.js
// Ground truth datasets (authentic, manipulated, propaganda, memes, medical_claims) and verification benchmarking suite

export const GroundTruthDataset = {
  authentic: [
    {
      id: "gt-auth-1",
      text: "Truth Guard Lens validation complete. ID: TG-9082-C2PA.",
      isManipulated: false,
      hasPropaganda: false,
      expectedCategory: "credential"
    },
    {
      id: "gt-auth-2",
      text: "System status report: Truth Guard verification engine updated to database version v4.2.1-alpha.",
      isManipulated: false,
      hasPropaganda: false,
      expectedCategory: "system_log"
    }
  ],
  manipulated: [
    {
      id: "gt-manip-1",
      text: "Official breaking emergency statement: Effective tomorrow morning, all banks will halt retail withdrawals.",
      isManipulated: true,
      hasPropaganda: false,
      expectedCategory: "emergency"
    }
  ],
  propaganda: [
    {
      id: "gt-prop-1",
      text: "Click to authorize consensus or your account will be immediately deleted.",
      isManipulated: false,
      hasPropaganda: true,
      expectedCategory: "phishing"
    }
  ],
  memes: [
    {
      id: "gt-meme-1",
      text: "A visual meme showing cat coding at anchor desk with emergency headers.",
      isManipulated: true,
      hasPropaganda: false,
      expectedCategory: "satire"
    }
  ],
  medical_claims: [
    {
      id: "gt-med-1",
      text: "Clinical reports indicate alternative remedies reverse respiratory ailments with zero latency.",
      isManipulated: false,
      hasPropaganda: false,
      expectedCategory: "medical"
    }
  ]
};

export const BenchmarkRunner = {
  /**
   * Run the evaluation benchmark suite over the datasets
   * @param {Function} verifyClaimFn - Callback function executing verification scoring
   * @returns {Object} Benchmark metrics report
   */
  async run(verifyClaimFn) {
    const startTime = Date.now();
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    // For Expected Calibration Error (ECE) calculations
    const bins = Array.from({ length: 5 }, () => ({ count: 0, sumConf: 0, sumAcc: 0 }));
    
    const allSamples = [
      ...GroundTruthDataset.authentic.map(s => ({ ...s, groundTruthTrue: true })),
      ...GroundTruthDataset.manipulated.map(s => ({ ...s, groundTruthTrue: false })),
      ...GroundTruthDataset.propaganda.map(s => ({ ...s, groundTruthTrue: false })),
      ...GroundTruthDataset.memes.map(s => ({ ...s, groundTruthTrue: false }))
    ];

    for (const sample of allSamples) {
      const pred = await verifyClaimFn(sample.text);
      const predictedTrue = pred.score >= 0.60;
      
      if (sample.groundTruthTrue && predictedTrue) truePositives++;
      else if (!sample.groundTruthTrue && predictedTrue) falsePositives++;
      else if (!sample.groundTruthTrue && !predictedTrue) trueNegatives++;
      else if (sample.groundTruthTrue && !predictedTrue) falseNegatives++;

      // Assign to ECE calibration bins based on confidence
      const binIdx = Math.min(4, Math.floor(pred.confidence * 5));
      const bin = bins[binIdx];
      bin.count++;
      bin.sumConf += pred.confidence;
      bin.sumAcc += (predictedTrue === sample.groundTruthTrue) ? 1 : 0;
    }

    // Calculate Precision, Recall, FPR
    const precision = truePositives / ((truePositives + falsePositives) || 1);
    const recall = truePositives / ((truePositives + falseNegatives) || 1);
    const fpr = falsePositives / ((falsePositives + trueNegatives) || 1);

    // Calculate Expected Calibration Error (ECE)
    let ece = 0;
    const totalCount = allSamples.length;
    bins.forEach(bin => {
      if (bin.count > 0) {
        const avgConf = bin.sumConf / bin.count;
        const avgAcc = bin.sumAcc / bin.count;
        ece += (bin.count / totalCount) * Math.abs(avgConf - avgAcc);
      }
    });

    const elapsed = Date.now() - startTime;

    return {
      precision: parseFloat(precision.toFixed(3)),
      recall: parseFloat(recall.toFixed(3)),
      falsePositiveRate: parseFloat(fpr.toFixed(3)),
      expectedCalibrationError: parseFloat(ece.toFixed(3)),
      averageLatencyMs: parseFloat((elapsed / totalCount).toFixed(1)),
      simulatedBatteryDecayPct: parseFloat((elapsed * 0.0002).toFixed(4)), // proxy battery metric
      totalSamples: totalCount
    };
  }
};
