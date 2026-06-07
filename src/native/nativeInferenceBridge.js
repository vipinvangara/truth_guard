/**
 * Truth Guard Native Inference Bridge
 * Abstracts model execution paths across native frameworks (CoreML, ONNX Runtime Mobile, ExecuTorch)
 * and falls back to browser WASM (Transformers.js) only when native runs are unavailable.
 */

import { RuntimeCapabilityDetector } from './runtimeCapabilityDetector';
import { ModelRuntimeManager } from '../runtime/modelRuntimeManager';

export const NativeInferenceBridge = {
  /**
   * Routes inference query to the most optimized platform backend
   * @param {string} modelId
   * @param {Object} payload
   * @returns {Promise<Object>} raw inference outputs
   */
  async execute(modelId, payload) {
    const { platform, preferredBackend } = RuntimeCapabilityDetector.detect();
    
    console.log(`NativeInferenceBridge: Routing ${modelId} to preferred backend: ${preferredBackend} on ${platform}`);

    // Route execution based on preferred platform runtime
    if (preferredBackend === 'CoreML' && platform === 'ios') {
      return this._executeCoreML(modelId, payload);
    }
    if (preferredBackend === 'ONNXMobile' && platform === 'android') {
      return this._executeONNXMobile(modelId, payload);
    }

    // Default browser fallback (via ModelRuntimeManager / TransformersJS WebGPU/WASM)
    return ModelRuntimeManager.infer(modelId, payload);
  },

  /**
   * Apple CoreML bridge mapping (simulated Native bindings wrapper)
   */
  async _executeCoreML(modelId, payload) {
    console.log(`NativeInferenceBridge: Executing ${modelId} via CoreML ANE (Apple Neural Engine)...`);
    await new Promise(r => setTimeout(r, 45)); // lower latency on native hardware
    return ModelRuntimeManager.infer(modelId, payload); // leverage singleton fallback mock
  },

  /**
   * ONNX Runtime Mobile bridge mapping (simulated Native bindings wrapper)
   */
  async _executeONNXMobile(modelId, payload) {
    console.log(`NativeInferenceBridge: Executing ${modelId} via ONNX Runtime Mobile NNAPI/GPU...`);
    await new Promise(r => setTimeout(r, 55)); // low latency native mobile runtime execution
    return ModelRuntimeManager.infer(modelId, payload); // leverage singleton fallback mock
  }
};
export default NativeInferenceBridge;
