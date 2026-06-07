/**
 * Truth Guard Embedding Index
 * Computes cosine similarity scores and nearest neighbor matching vectors locally.
 */

export const EmbeddingIndex = {
  /**
   * Calculate cosine similarity between two float arrays
   * @param {Array<number>} vecA
   * @param {Array<number>} vecB
   * @returns {number} similarity score (0.0 to 1.0)
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
    
    if (normA === 0 || normB === 0) return 0;
    return parseFloat((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
  },

  /**
   * Search index entries for nearest neighbors matching a query
   * @param {Array<Object>} indexEntries - [{ id, embedding, metadata }]
   * @param {Array<number>} queryEmbedding
   * @param {number} topK
   * @returns {Array<Object>} list of match objects with similarity score
   */
  search(indexEntries = [], queryEmbedding = [], topK = 3) {
    if (!queryEmbedding || queryEmbedding.length === 0) return [];
    
    const scores = indexEntries.map(entry => {
      const similarity = this.cosineSimilarity(entry.embedding, queryEmbedding);
      return {
        ...entry,
        similarity
      };
    });

    // Sort descending by similarity
    return scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
};
export default EmbeddingIndex;
