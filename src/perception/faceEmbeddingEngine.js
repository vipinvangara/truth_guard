/**
 * Truth Guard Face Embedding Engine
 * Processes visual face meshes and identity embeddings offline.
 */

import { InferenceBus } from '../runtime/inferenceBus';

export const FaceEmbeddingEngine = {
  /**
   * Extract embedding vectors from visual faces
   * @param {Object} mediaRef
   * @returns {Promise<Object>} Identity mapping details
   */
  async extract(mediaRef) {
    const payload = {
      imageUri: mediaRef.uri || '',
      payloadString: mediaRef.base64 || mediaRef.contentHash || mediaRef.uri || '',
      text: mediaRef.text || ''
    };

    try {
      return await InferenceBus.enqueue('face-embeddings', payload, { priority: 'medium' });
    } catch (err) {
      console.warn("FaceEmbeddingEngine: Extraction skipped.");
      return { faces: [] };
    }
  }
};
