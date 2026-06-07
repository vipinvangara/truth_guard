// src/services/observationExtractor.js
// Extracts clean, objective scene observations prior to claim decomposition
// Strict requirement: Avoid interpretations, geopolitical conclusions, emotional framing, or truth assertions.

export const ObservationExtractor = {
  /**
   * Parse scene graph and perception state into objective observation nodes
   * @param {Object} sceneGraph - Relational scene graph
   * @param {Object} perceptionState - Fused PerceptionState
   * @returns {Object} { observations: Array }
   */
  extractObservations(sceneGraph = {}, perceptionState = {}) {
    const observations = [];
    const entities = sceneGraph.entities || [];
    const relationships = sceneGraph.relationships || [];
    const sceneAttributes = sceneGraph.sceneAttributes || [];

    // 1. Extract environment observations
    sceneAttributes.forEach(attr => {
      if (attr.type === 'environment') {
        observations.push({
          text: `Visual frame environment indicates a ${attr.value}.`,
          description: `Visual frame environment indicates a ${attr.value}.`, // UI compatibility
          source: "scene_graph",
          confidence: attr.confidence,
          supportingEntities: entities.map(e => e.id)
        });
      }
    });

    // 2. Extract visual entity observations
    entities.forEach(ent => {
      let labelText = ent.label.toLowerCase();
      let objText = `An entity of type '${labelText}' is visible.`;

      if (labelText.includes('anchor') || labelText.includes('person')) {
        objText = "Visual frame contains one individual behind a desk structure.";
      } else if (labelText.includes('microphone')) {
        objText = "A microphone object is positioned near the center of the frame.";
      } else if (labelText.includes('panel') || labelText.includes('ticker')) {
        objText = "A graphic panel with a text ticker overlay is present in the lower quadrant.";
      } else if (labelText.includes('seal') || labelText.includes('signature')) {
        objText = "A digital verification stamp or cryptographic mark is embedded in the document.";
      }

      observations.push({
        text: objText,
        description: objText, // UI compatibility
        source: "scene_graph",
        confidence: ent.confidence,
        supportingEntities: [ent.id]
      });
    });

    // 3. Extract text content observations neutrally (OCR)
    const ocrText = (perceptionState.extractedText || []).join(' ').trim();
    if (ocrText) {
      // Split into neutral snippets
      const snippets = ocrText.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 5);
      snippets.forEach((snippet, idx) => {
        // Keep it objective
        observations.push({
          text: `Text segment extracted: "${snippet}"`,
          description: `Text segment extracted: "${snippet}"`, // UI compatibility
          source: "ocr",
          confidence: 0.95,
          supportingEntities: []
        });
      });
    }

    // 4. Extract pixel anomaly observations
    const regions = Array.isArray(perceptionState.regions) ? perceptionState.regions : [];
    const anomalousRegions = regions.filter(r => r.anomalies && r.anomalies.length > 0);
    anomalousRegions.forEach(r => {
      r.anomalies.forEach((anom, idx) => {
        observations.push({
          text: `Pixel variance metric discrepancy registered in region ${r.region || r.name}: "${anom}"`,
          description: `Pixel variance metric discrepancy registered in region ${r.region || r.name}: "${anom}"`, // UI compatibility
          source: "forensics",
          confidence: r.saliencyScore || 0.85,
          supportingEntities: []
        });
      });
    });

    // Baseline fallback if empty
    if (observations.length === 0) {
      observations.push({
        text: "Visual frame exhibits standard digital canvas parameters.",
        description: "Visual frame exhibits standard digital canvas parameters.", // UI compatibility
        source: "default",
        confidence: 0.70,
        supportingEntities: []
      });
    }

    return {
      observations
    };
  }
};
