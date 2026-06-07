/**
 * Truth Guard Local Feature Store
 * Caches heavy computed features (embeddings, OCR, perceptual hashes, visual detections)
 * using the asset hash (SHA256) as the primary key.
 */

class FeatureStore {
  constructor() {
    this.store = new Map();
  }

  /**
   * Check if features exist for an asset hash
   * @param {string} hash - SHA256 of the asset
   * @returns {boolean}
   */
  has(hash) {
    return this.store.has(hash);
  }

  /**
   * Retrieve cached features for an asset hash
   * @param {string} hash
   * @returns {object|null}
   */
  get(hash) {
    return this.store.get(hash) || null;
  }

  /**
   * Store features for an asset hash
   * @param {string} hash
   * @param {string} featureName - e.g., 'ocr', 'embeddings', 'forensics', 'scene'
   * @param {*} value
   */
  setFeature(hash, featureName, value) {
    if (!this.store.has(hash)) {
      this.store.set(hash, {});
    }
    const assetFeatures = this.store.get(hash);
    assetFeatures[featureName] = value;
    this.store.set(hash, assetFeatures);
  }

  /**
   * Get specific feature value
   * @param {string} hash
   * @param {string} featureName
   * @returns {*}
   */
  getFeature(hash, featureName) {
    const assetFeatures = this.get(hash);
    if (!assetFeatures) return null;
    return assetFeatures[featureName] !== undefined ? assetFeatures[featureName] : null;
  }

  /**
   * Purge cache records for an asset
   * @param {string} hash
   */
  purge(hash) {
    this.store.delete(hash);
  }

  /**
   * Clear all cache records
   */
  clear() {
    this.store.clear();
  }
}

// Export singleton instance
export const featureStore = new FeatureStore();
