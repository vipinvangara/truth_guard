// src/services/claimDecomposer.js
// Decomposes claim statements into structured triples (subject, predicate, object) while preserving origin provenance metadata

export const ClaimDecomposer = {
  /**
   * Decompose a sentence into subject-predicate-object structure while attaching provenance context
   * @param {string} sentence - Claim text
   * @param {Object} provenanceSource - Modality origin details
   * @returns {Object} Structured claim node containing triple + origin provenance
   */
  decompose(sentence, provenanceSource = {}) {
    if (!sentence) {
      return { 
        subject: "", 
        predicate: "", 
        object: "", 
        rawText: "",
        origin: { source: "unknown", region: null, confidence: 0.50 }
      };
    }
    
    const text = sentence.trim();
    
    // Default origin details
    const origin = {
      source: provenanceSource.source || "VLM",
      region: provenanceSource.region || null,
      confidence: provenanceSource.confidence !== undefined ? provenanceSource.confidence : 0.80
    };
    
    // Heuristic predicate matcher locating auxiliary and action verbs
    const verbRegex = /\b(is|was|were|are|will|has|have|had|declaring|claims|originating|represents|matches|indicates)\b/i;
    const match = text.match(verbRegex);
    
    if (match) {
      const predicateWord = match[0];
      const idx = text.indexOf(predicateWord);
      
      const subject = text.substring(0, idx).trim();
      const predicate = predicateWord.toLowerCase();
      const object = text.substring(idx + predicateWord.length).trim();
      
      return {
        subject: subject || "unspecified",
        predicate,
        object: object || "unspecified",
        rawText: text,
        origin
      };
    }
    
    // Fallback: split on first space
    const firstSpace = text.indexOf(' ');
    if (firstSpace !== -1) {
      return {
        subject: text.substring(0, firstSpace).trim(),
        predicate: "asserts",
        object: text.substring(firstSpace + 1).trim(),
        rawText: text,
        origin
      };
    }

    return {
      subject: text,
      predicate: "exists",
      object: "true",
      rawText: text,
      origin
    };
  }
};
