// src/services/embeddingStore.js
// Local vector store with version controls to prevent cache corruption across model iterations

export const EmbeddingStore = {
  // Current active version flags
  modelVersion: "tg-v2.3",
  embeddingVersion: "jaccard-32d",
  
  // Database store: contentHash -> { embedding: Array<number>, text: string, report: Object, modelVersion: string, embeddingVersion: string }
  cache: {},

  /**
   * Helper to generate a deterministic mock embedding vector (32-dim) for a string
   */
  generateEmbedding(text) {
    const vector = new Array(32).fill(0);
    const cleaned = (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (let i = 0; i < cleaned.length; i++) {
      const dim = i % 32;
      vector[dim] += cleaned.charCodeAt(i) / 122.0;
    }
    
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(val => val / magnitude);
  },

  /**
   * Helper to calculate Cosine Similarity between two numeric vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  },

  /**
   * Register a new asset/claim in vector memory
   */
  save(hash, text, report) {
    if (!hash) return;
    const embedding = this.generateEmbedding(text);
    this.cache[hash] = {
      embedding,
      text,
      report,
      modelVersion: this.modelVersion,
      embeddingVersion: this.embeddingVersion,
      timestamp: Date.now()
    };
  },

  /**
   * Retrieve nearest neighbor by query string or vector similarity
   * @param {string} text - Query statement
   * @param {number} threshold - Minimum cosine similarity (0.0 to 1.0)
   * @returns {Object|null} Nearest neighbor record
   */
  findNearest(text, threshold = 0.88) {
    const queryVec = this.generateEmbedding(text);
    let bestMatch = null;
    let bestScore = -1;

    Object.entries(this.cache).forEach(([hash, record]) => {
      // Prevent index mismatches by verifying version keys first
      if (record.modelVersion !== this.modelVersion || record.embeddingVersion !== this.embeddingVersion) {
        return;
      }
      
      const score = this.cosineSimilarity(queryVec, record.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = record;
      }
    });

    if (bestMatch && bestScore >= threshold) {
      console.log(`Embedding memory hit: version match successful, similarity: ${bestScore.toFixed(3)}`);
      return {
        ...bestMatch,
        similarity: bestScore
      };
    }

    return null;
  }
};
