/**
 * Truth Guard Runtime Warmup Utility
 * Preloads local model weights, caches tokenizers, and compiles WebGPU kernels in a background thread.
 */

import { ModelRuntimeManager } from './modelRuntimeManager';

export const RuntimeWarmup = {
  /**
   * Run background warmups for local pipelines
   * @returns {Promise<Object>} warmup completion report
   */
  async warmup() {
    console.log("RuntimeWarmup: Starting progressive offline model warmup...");

    const preheatTargets = [
      'yolo-lite',         // Object detector (high priority)
      'florence2-base',    // Captioning engine (medium priority)
      'text-embedding'     // Vector embedding engine (medium priority)
    ];

    const results = {};

    // Execute progressively on app launch using microtasks to prevent blocking UI main thread
    for (const modelId of preheatTargets) {
      try {
        // Run lazy loading and GPU/NPU compilation checks
        await ModelRuntimeManager.loadModel(modelId);
        results[modelId] = 'ready';
        console.log(`RuntimeWarmup: Warmup complete for local model: ${modelId}`);
      } catch (err) {
        results[modelId] = 'failed';
        console.warn(`RuntimeWarmup: Warmup failed for ${modelId}:`, err);
      }
      // Brief pause to allow browser repaint/ticks
      await new Promise(r => setTimeout(r, 100));
    }

    console.log("RuntimeWarmup: Progressive model preheat completed.");
    return {
      status: 'warmed_up',
      details: results
    };
  }
};
