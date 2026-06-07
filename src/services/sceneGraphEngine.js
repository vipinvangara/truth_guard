/**
 * Truth Guard Scene Graph Engine
 * Converts raw perception inputs into structured relational scene graphs.
 */

export const SceneGraphEngine = {
  /**
   * Generate relational scene graph from perception outputs
   * @param {Object} sceneUnderstanding - VLM captioning results
   * @param {Object} objectResult - Object detection list
   * @param {Object} ocrResult - OCR parsed text
   * @param {Object} regionResult - Salient regions
   * @param {Object} provenanceResult - Metadata analysis
   * @returns {Object} Structured scene graph
   */
  generate(sceneUnderstanding = {}, objectResult = {}, ocrResult = {}, regionResult = {}, provenanceResult = {}) {
    const entities = [];
    const relationships = [];
    const sceneAttributes = [];

    const objects = objectResult.objects || [];
    const tiles = regionResult.tiles || [];
    const ocrClaims = ocrResult.claims || [];
    const vlmText = (sceneUnderstanding.scene || '').toLowerCase();
    const vlmObjects = sceneUnderstanding.objects || [];

    // Helper to calculate bbox distance/overlap for spatial relations
    const getBboxDistance = (bboxA, bboxB) => {
      if (!bboxA || !bboxB) return Infinity;
      const [ay1, ax1, ay2, ax2] = bboxA;
      const [by1, bx1, by2, bx2] = bboxB;
      const centerA = [(ay1 + ay2) / 2, (ax1 + ax2) / 2];
      const centerB = [(by1 + by2) / 2, (bx1 + bx2) / 2];
      return Math.sqrt(Math.pow(centerA[0] - centerB[0], 2) + Math.pow(centerA[1] - centerB[1], 2));
    };

    // 1. Process Visual Object Detections into Entities
    objects.forEach((obj, idx) => {
      const label = obj.label || 'object';
      const id = `${label.toLowerCase().replace(/\s+/g, '_')}_${idx + 1}`;
      entities.push({
        id,
        label,
        confidence: obj.confidence || 0.80,
        bbox: obj.bbox || [0, 0, 100, 100],
        source: 'object_detector'
      });
    });

    // Extract additional entities from OCR if they represent names/concepts
    ocrClaims.forEach((claim, idx) => {
      if (claim.text && claim.text.includes('Google')) {
        if (!entities.some(e => e.label === 'Google')) {
          entities.push({
            id: `google_${idx + 1}`,
            label: 'Google organization logo',
            confidence: claim.confidence || 0.90,
            bbox: [10, 10, 50, 150],
            source: 'ocr'
          });
        }
      }
    });

    // Extract environment attribute
    let envValue = 'unspecified environment';
    let envConfidence = 0.50;

    if (vlmText.includes('news') || vlmText.includes('broadcast') || entities.some(e => e.label.includes('anchor') || e.label.includes('desk'))) {
      envValue = 'broadcast news studio';
      envConfidence = 0.92;
    } else if (vlmText.includes('document') || vlmText.includes('certificate') || entities.some(e => e.label.includes('seal') || e.label.includes('credential'))) {
      envValue = 'digital document workspace';
      envConfidence = 0.95;
    } else if (vlmText.includes('street') || vlmText.includes('road') || vlmText.includes('urban')) {
      envValue = 'urban street';
      envConfidence = 0.85;
    }

    sceneAttributes.push({
      type: 'environment',
      value: envValue,
      confidence: envConfidence
    });

    // 2. Infer Relational Edges (Spatial & Actions)
    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < entities.length; j++) {
        if (i === j) continue;
        const entA = entities[i];
        const entB = entities[j];

        // Spatial checking based on bounding boxes
        const distance = getBboxDistance(entA.bbox, entB.bbox);

        // a) standing_near / near
        if (distance < 200) {
          const confidence = Math.max(0.60, parseFloat((1 - distance / 400).toFixed(2)));
          relationships.push({
            subject: entA.id,
            relation: 'standing_near',
            object: entB.id,
            confidence
          });
        }

        // b) holding (e.g. anchor and microphone)
        if (entA.label.includes('anchor') && entB.label.includes('microphone') && distance < 120) {
          relationships.push({
            subject: entA.id,
            relation: 'holding',
            object: entB.id,
            confidence: 0.88
          });
        }

        // c) attached_to (e.g., security seals on credential tag)
        if (entA.label.includes('seal') && entB.label.includes('tag') && distance < 80) {
          relationships.push({
            subject: entA.id,
            relation: 'attached_to',
            object: entB.id,
            confidence: 0.94
          });
        }
      }
    }

    // Add action relationships derived from semantic context
    const anchorEntity = entities.find(e => e.label.includes('anchor') || e.label.includes('person'));
    const panelEntity = entities.find(e => e.label.includes('panel') || e.label.includes('ticker') || e.label.includes('graphic'));

    if (anchorEntity) {
      if (vlmText.includes('speaking') || vlmText.includes('declaring')) {
        relationships.push({
          subject: anchorEntity.id,
          relation: 'speaking',
          object: panelEntity ? panelEntity.id : 'broadcast_stream',
          confidence: 0.90
        });
      }
      if (vlmText.includes('riding') || vlmText.includes('bicycle')) {
        relationships.push({
          subject: anchorEntity.id,
          relation: 'riding',
          object: 'bicycle',
          confidence: 0.85
        });
      }
    }

    return {
      entities,
      relationships,
      sceneAttributes
    };
  }
};
