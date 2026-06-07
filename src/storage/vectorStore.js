/**
 * Truth Guard Vector Store
 * Offline-first persistent local vector database for matching asset embeddings.
 */

import { EmbeddingIndex } from './embeddingIndex';

class VectorStoreClass {
  constructor() {
    this.store = [];
  }

  /**
   * Insert new embedding node into vector index
   * @param {string} id
   * @param {string} text
   * @param {Array<number>} embedding
   * @param {Object} metadata
   */
  save(id, text, embedding, metadata = {}) {
    // Remove duplicates if same ID exists
    this.store = this.store.filter(e => e.id !== id);
    
    this.store.push({
      id,
      text,
      embedding,
      metadata,
      timestamp: Date.now()
    });
    
    console.log(`VectorStore: Saved vector node for ID ${id}. Total index size: ${this.store.length}`);
  }

  /**
   * Query database using similarity checks
   * @param {Array<number>} queryEmbedding
   * @param {number} threshold
   * @param {number} topK
   * @returns {Array<Object>} Matches above similarity threshold
   */
  search(queryEmbedding = [], threshold = 0.85, topK = 3) {
    if (!queryEmbedding || queryEmbedding.length === 0) return [];
    
    const matches = EmbeddingIndex.search(this.store, queryEmbedding, topK);
    return matches.filter(m => m.similarity >= threshold);
  }

  /**
   * Reset store
   */
  clear() {
    this.store = [];
    console.log("VectorStore: Reset local vector index.");
  }
}

export const VectorStore = new VectorStoreClass();
export default VectorStore;
