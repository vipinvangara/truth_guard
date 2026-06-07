/**
 * Truth Guard Inference Scheduler (Battery-Aware Local Engine)
 * Manages dynamically customized model executions depending on resource availability and asset risk.
 */

class InferenceSchedulerClass {
  constructor() {
    this.batteryLevel = 0.85;
    this.isCharging = false;
    this.thermalState = 'nominal';
  }

  updateBatteryTelemetry(level, isCharging) {
    this.batteryLevel = level;
    this.isCharging = isCharging;
  }

  updateThermalTelemetry(state) {
    this.thermalState = state;
  }

  /**
   * Resolve execution policy for a given input reference
   * @param {Object} mediaRef
   * @returns {Object} resolved policy parameters
   */
  resolveExecutionPolicy(mediaRef = {}) {
    const textContext = (mediaRef.text || mediaRef.uri || '').toLowerCase();
    
    // Core decision indicators
    let pipelineDepth = 'FULL'; // 'FULL' | 'OPTIMIZED' | 'LIGHT'
    let runForensicCNN = true;
    let runHeavyReasoning = true;
    let frameRateDivisor = 1; // Process every frame in videos

    // 1. Thermal or Battery degradation thresholds
    if (this.thermalState === 'critical' || this.batteryLevel < 0.20) {
      pipelineDepth = 'LIGHT';
      runForensicCNN = false;
      runHeavyReasoning = false;
      frameRateDivisor = 5; // skip 80% of video frames
    } else if (this.thermalState === 'serious' || this.batteryLevel < 0.45) {
      pipelineDepth = 'OPTIMIZED';
      runForensicCNN = true;
      runHeavyReasoning = false;
      frameRateDivisor = 3; // skip 66% of video frames
    }

    // 2. Escalation override: suspicious keywords trigger deep forensics regardless of battery
    const isSuspicious = textContext.includes('withdrawal') || 
                          textContext.includes('emergency') || 
                          textContext.includes('deletion') || 
                          textContext.includes('tampered');
                          
    if (isSuspicious && pipelineDepth === 'LIGHT') {
      pipelineDepth = 'OPTIMIZED';
      runForensicCNN = true; // force activate forensics
    }

    // 3. Charger override: full capabilities under power connection
    if (this.isCharging && this.thermalState !== 'critical') {
      pipelineDepth = 'FULL';
      runForensicCNN = true;
      runHeavyReasoning = true;
      frameRateDivisor = 1;
    }

    return {
      pipelineDepth,
      runForensicCNN,
      runHeavyReasoning,
      frameRateDivisor,
      thermalState: this.thermalState,
      batteryLevel: this.batteryLevel,
      isCharging: this.isCharging
    };
  }
}

export const InferenceScheduler = new InferenceSchedulerClass();
export default InferenceScheduler;
