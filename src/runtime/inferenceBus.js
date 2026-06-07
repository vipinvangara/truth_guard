/**
 * Truth Guard Inference Bus
 * Queue-based centralized inference coordinator supporting batching, cancellation, and prioritization.
 */

import { ModelRuntimeManager } from './modelRuntimeManager';

class InferenceBusClass {
  constructor() {
    this.queue = [];
    this.activeTaskCount = 0;
    this.maxConcurrentTasks = 2; // limit parallel runs to prevent NPU/GPU bottleneck
    this.cancelledTokens = new Set();
  }

  /**
   * Enqueue an inference request
   * @param {string} modelId
   * @param {Object} payload
   * @param {Object} options - { priority: 'high'|'medium'|'low', cancelToken: string, batchable: boolean }
   * @returns {Promise<Object>} Inference prediction results
   */
  enqueue(modelId, payload, options = {}) {
    const priority = options.priority || 'medium';
    const cancelToken = options.cancelToken || null;
    const batchable = options.batchable || false;

    return new Promise((resolve, reject) => {
      this.queue.push({
        modelId,
        payload,
        priority,
        cancelToken,
        batchable,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Sort queue: high priority first, then oldest first
      this._sortQueue();
      this._processQueue();
    });
  }

  /**
   * Cancel in-flight or queued requests matching a token
   * @param {string} cancelToken
   */
  cancel(cancelToken) {
    if (!cancelToken) return;
    this.cancelledTokens.add(cancelToken);
    
    // Filter out queued tasks matching token and reject them
    this.queue = this.queue.filter(task => {
      if (task.cancelToken === cancelToken) {
        task.reject(new Error("Inference task cancelled."));
        return false;
      }
      return true;
    });
  }

  /**
   * Clear cancelled tokens registry
   * @param {string} cancelToken
   */
  clearCancelToken(cancelToken) {
    this.cancelledTokens.delete(cancelToken);
  }

  _sortQueue() {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    this.queue.sort((a, b) => {
      const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.timestamp - b.timestamp;
    });
  }

  async _processQueue() {
    if (this.activeTaskCount >= this.maxConcurrentTasks || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();

    // Check if task was cancelled before executing
    if (task.cancelToken && this.cancelledTokens.has(task.cancelToken)) {
      task.reject(new Error("Inference task cancelled."));
      this._processQueue();
      return;
    }

    this.activeTaskCount++;

    try {
      // Check if we can batch other matching tasks currently in the queue
      let batchTasks = [];
      if (task.batchable) {
        batchTasks = this.queue.filter(t => t.modelId === task.modelId && t.batchable && (!t.cancelToken || !this.cancelledTokens.has(t.cancelToken)));
        this.queue = this.queue.filter(t => !batchTasks.includes(t));
      }

      if (batchTasks.length > 0) {
        console.log(`InferenceBus: Batching ${batchTasks.length + 1} requests for model ${task.modelId}`);
        // Combine payloads
        const combinedPayloads = [task.payload, ...batchTasks.map(t => t.payload)];
        const batchResults = await ModelRuntimeManager.infer(task.modelId, { batch: true, payloads: combinedPayloads });

        // Resolve all tasks
        task.resolve(batchResults[0] || batchResults);
        batchTasks.forEach((t, idx) => {
          t.resolve(batchResults[idx + 1] || batchResults);
        });
      } else {
        // Standard single execution
        const result = await ModelRuntimeManager.infer(task.modelId, task.payload);
        task.resolve(result);
      }
    } catch (error) {
      task.reject(error);
    } finally {
      this.activeTaskCount--;
      // Run next task
      this._processQueue();
    }
  }
}

export const InferenceBus = new InferenceBusClass();
