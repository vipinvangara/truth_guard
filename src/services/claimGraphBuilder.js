/**
 * Truth Guard Claim Graph Builder
 * Converts objective observations and grounded entities into independently verifiable atomic claims.
 */

export const ClaimGraphBuilder = {
  /**
   * Convert observations and entities into atomic claim nodes
   * @param {Object} observationResult - List of objective observations
   * @param {Object} groundingResult - Grounded entity candidates
   * @returns {Object} { claims: Array }
   */
  build(observationResult = {}, groundingResult = {}) {
    const claims = [];
    const observations = observationResult.observations || [];
    const candidates = groundingResult.candidates || [];

    // Helper to decompose text into S-P-O
    const decomposeToTriple = (text) => {
      const cleanText = text.replace(/^text segment extracted:\s*"/i, '').replace(/"$/, '').trim();
      const verbRegex = /\b(is|was|were|are|will|has|have|had|declaring|claims|originating|represents|matches|indicates|contains|exhibits|positioned|embedded)\b/i;
      const match = cleanText.match(verbRegex);

      if (match) {
        const predicateWord = match[0];
        const idx = cleanText.indexOf(predicateWord);
        const subject = cleanText.substring(0, idx).trim() || 'subject';
        const predicate = predicateWord.toLowerCase();
        const object = cleanText.substring(idx + predicateWord.length).trim() || 'true';

        return { subject, predicate, object, rawText: cleanText };
      }

      // Fallback
      const spaceIdx = cleanText.indexOf(' ');
      if (spaceIdx !== -1) {
        return {
          subject: cleanText.substring(0, spaceIdx).trim(),
          predicate: "asserts",
          object: cleanText.substring(spaceIdx + 1).trim(),
          rawText: cleanText
        };
      }

      return {
        subject: cleanText,
        predicate: "exists",
        object: "true",
        rawText: cleanText
      };
    };

    observations.forEach((obs, idx) => {
      const { text, source, confidence, supportingEntities } = obs;
      const triple = decomposeToTriple(text);

      // Determine bounding box coordinates from supporting entities if possible
      let supportingRegions = [];
      if (supportingEntities && supportingEntities.length > 0) {
        // Mock bounding boxes for regions if available
        supportingRegions = [[10, 10, 200, 200]];
      }

      claims.push({
        id: `claim_${idx + 1}`,
        subject: triple.subject,
        predicate: triple.predicate,
        object: triple.object,
        text: triple.rawText, // for backward compatibility & highlight matches
        provenance: {
          source: source || "observation",
          supportingRegions,
          confidence: confidence || 0.80
        }
      });
    });

    // Ground candidate alignments as contextual assertions (e.g. historical constraints)
    candidates.forEach((cand, idx) => {
      claims.push({
        id: `claim_grounding_${idx + 1}`,
        subject: cand.possibleMatch,
        predicate: "classified_as",
        object: cand.entityType,
        text: `${cand.possibleMatch} matches the ${cand.entityType} profile.`,
        provenance: {
          source: "entity_grounding",
          supportingRegions: [],
          confidence: cand.confidence || 0.85
        }
      });
    });

    return {
      claims
    };
  }
};
