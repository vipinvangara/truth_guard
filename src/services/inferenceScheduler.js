/**
 * Truth Guard Inference Scheduler (Battery-Aware Resource Manager)
 * Resolves optimal model configurations dynamically to prevent mobile device overheating,
 * memory overflow, or severe battery depletion.
 */

// Simulated on-device hardware stats (integrated with native modules where supported)
let cachedBatteryLevel = 0.85; // 0.0 to 1.0
let cachedIsCharging = false;
let cachedThermalState = 'nominal'; // 'nominal' | 'fair' | 'serious' | 'critical'

export const InferenceScheduler = {
  
  /**
   * Update current battery status telemetry
   * @param {number} level - Battery fraction (0.0 to 1.0)
   * @param {boolean} isCharging
   */
  updateBatteryTelemetry(level, isCharging) {
    cachedBatteryLevel = level;
    cachedIsCharging = isCharging;
  },

  /**
   * Update current device thermal load
   * @param {string} state - 'nominal' | 'fair' | 'serious' | 'critical'
   */
  updateThermalTelemetry(state) {
    cachedThermalState = state;
  },

  /**
   * Get telemetry values
   */
  getHardwareState() {
    return {
      batteryLevel: cachedBatteryLevel,
      isCharging: cachedIsCharging,
      thermalState: cachedThermalState
    };
  },

  /**
   * Resolves optimal execution strategy based on device metrics.
   * Strategies:
   * - FULL: Deep VLM + Full pixel forensics (Charger connected or battery > 50% & healthy thermal)
   * - OPTIMIZED: Deep VLM on sample frames, standard forensics (Battery > 25%, thermal <= serious)
   * - LIGHT: Skip local VLM, fallback to heuristics/metadata, skip complex pixel checkers (Battery < 25% or thermal === critical)
   * 
   * @returns {Object} configuration policy
   */
  resolveExecutionPolicy(mediaType) {
    const battery = cachedBatteryLevel;
    const isCharging = cachedIsCharging;
    const thermal = cachedThermalState;

    let mode = 'FULL';
    let videoFrameIntervalMs = 1000; // Sample frame every 1s
    let runHeavyVLM = true;
    let runForensicCNN = true;
    let maxTokens = 150;

    // Thermal or battery throttling thresholds
    if (thermal === 'critical' || battery < 0.20) {
      mode = 'LIGHT';
      runHeavyVLM = false;
      runForensicCNN = false;
      videoFrameIntervalMs = 0; // Disable video decoding
    } else if (thermal === 'serious' || battery < 0.40) {
      mode = 'OPTIMIZED';
      runHeavyVLM = true;
      runForensicCNN = true;
      maxTokens = 60; // Constrained sequence length
      videoFrameIntervalMs = 3000; // Sample frame every 3s to reduce CPU overhead
    }

    // Charger override
    if (isCharging && thermal !== 'critical') {
      mode = 'FULL';
      runHeavyVLM = true;
      runForensicCNN = true;
      videoFrameIntervalMs = 1000;
      maxTokens = 150;
    }

    return {
      mode,
      runHeavyVLM,
      runForensicCNN,
      videoFrameIntervalMs,
      maxTokens,
      thermal,
      battery,
      isCharging
    };
  }
};
