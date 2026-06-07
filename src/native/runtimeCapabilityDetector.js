/**
 * Truth Guard Runtime Capability Detector
 * Evaluates hardware support (WebGPU, NPU, native frameworks) to determine optimal execution backends.
 */

import { Platform } from 'react-native';

export const RuntimeCapabilityDetector = {
  /**
   * Resolve hardware constraints and capability markers
   * @returns {Object} capabilities
   */
  detect() {
    const platform = Platform.OS; // 'ios' | 'android' | 'web' | 'windows' | 'macos'
    let hasWebGPU = false;
    let hasNPU = false;

    // Check WebGPU availability if in browser environment
    if (platform === 'web' && typeof navigator !== 'undefined') {
      hasWebGPU = !!navigator.gpu;
    }

    // CoreML / NNAPI availability check
    if (platform === 'ios') {
      hasNPU = true; // Apple Neural Engine is standard on modern iOS devices
    } else if (platform === 'android') {
      hasNPU = true; // Android Neural Networks API / Hexagon NPU is standard
    } else if (platform === 'windows') {
      hasNPU = false; // Check for DirectML availability (simplified mock)
    }

    // Decide preferred backend path
    let preferredBackend = 'TransformersJS'; // fallback
    if (platform === 'ios') {
      preferredBackend = 'CoreML';
    } else if (platform === 'android') {
      preferredBackend = 'ONNXMobile';
    } else if (hasWebGPU) {
      preferredBackend = 'WebGPU';
    }

    return {
      platform,
      hasWebGPU,
      hasNPU,
      preferredBackend,
      maxRecommendedMemoryMb: platform === 'web' ? 1024 : 4096
    };
  }
};
export default RuntimeCapabilityDetector;
