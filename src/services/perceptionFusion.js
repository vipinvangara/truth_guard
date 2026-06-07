// src/services/perceptionFusion.js
// Aggregates visual, text, region, and metadata modality vectors into a unified PerceptionState

export const PerceptionFusion = {
  /**
   * Fuse multi-head inputs into a consolidated state
   * @param {Object} vlmData - Scene descriptor/dense caption output
   * @param {Array} objectData - Grounded objects with bounding boxes
   * @param {Object} ocrData - Extracted OCR claim statements
   * @param {Object} regionData - Grid tiling anomalies/local objects
   * @param {Object} provenanceData - EXIF/C2PA certificate signatures
   * @returns {Object} Consolidated PerceptionState
   */
  fuse(vlmData, objectData, ocrData, regionData, provenanceData) {
    const scene = vlmData.scene || "Unknown visual scene context.";
    
    // Combine object labels from both VLM and dedicated ObjectDetector
    const objectsSet = new Set([
      ...(vlmData.objects || []), 
      ...(objectData || []).map(o => o.label)
    ]);

    // Combine actions
    const actionsSet = new Set(vlmData.activities || []);

    // Combine extracted text snippets
    const textSet = new Set([
      ...(ocrData.claims || []).map(c => c.text)
    ]);

    // Combine proper nouns/entities
    const entitiesSet = new Set([
      ...(vlmData.entities || []),
      ...(ocrData.claims || []).flatMap(c => c.entities || [])
    ]);

    // Format regional tiled grid reports
    const regions = (regionData.tiles || []).map(tile => ({
      name: tile.region,
      objects: tile.objects || [],
      anomalies: tile.anomalies || [],
      row: tile.row,
      col: tile.col
    }));

    // Gather observations from all headers
    const observations = [
      `Local SmolVLM scene description complete.`,
      `Object detector registered ${objectData.length} bounding-box regions.`,
      `OCR processor extracted ${ocrData.claims.length} claims.`,
      `Tiled grid scanning registered ${regions.filter(r => r.anomalies.length > 0).length} anomalous tiles.`,
      `Provenance validation status: ${provenanceData.status.toUpperCase()} (confidence: ${provenanceData.provenanceConfidence}).`
    ];

    // Compute calibration uncertainty indices per input modality
    const uncertainty = {
      vlm: parseFloat((vlmData.uncertainty || 0.12).toFixed(2)),
      objects: objectData.length > 0 ? 0.08 : 0.25,
      ocr: parseFloat((1 - (ocrData.confidence || 0.80)).toFixed(2)),
      provenance: parseFloat((1 - provenanceData.provenanceConfidence).toFixed(2))
    };

    return {
      scene,
      objects: Array.from(objectsSet),
      actions: Array.from(actionsSet),
      text: Array.from(textSet),
      entities: Array.from(entitiesSet),
      regions,
      uncertainty,
      observations
    };
  }
};
