/**
 * Truth Guard Saliency Engine
 * Computes visual focus regions to optimize downstream pixel inspection.
 */

import { InferenceBus } from '../runtime/inferenceBus';

export const SaliencyEngine = {
  /**
   * Resolve salient focus zones
   * @param {Object} mediaRef
   * @returns {Promise<Array>} List of prioritized saliency tiles
   */
  async getSalientTiles(mediaRef) {
    const payload = {
      imageUri: mediaRef.uri || '',
      payloadString: mediaRef.base64 || mediaRef.contentHash || mediaRef.uri || '',
      text: mediaRef.text || ''
    };

    try {
      return await InferenceBus.enqueue('saliency-detector', payload, { priority: 'high' });
    } catch (err) {
      console.warn("SaliencyEngine: Fallback tiles loaded.");
      return [];
    }
  }
};
