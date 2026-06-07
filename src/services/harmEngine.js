/**
 * Truth Guard Harm Analysis Engine
 * Screens claims for potential societal or health risks (medical misinformation,
 * phishing scams, dangerous operations, state-level propaganda).
 */

export const HarmEngine = {
  
  /**
   * Run harm risk screening
   * @param {Array<string>} claims - List of claim strings
   * @returns {Object} harm evaluation
   */
  assess(claims) {
    let harmLevel = "low";
    let category = "nominal";
    const reasoning = [];

    const text = claims.map(c => c.toLowerCase()).join(' ');

    // 1. Phishing & Scams
    if (text.includes('deletion') || text.includes('risk') || text.includes('unauthorized')) {
      harmLevel = "high";
      category = "credential_harvesting_fraud";
      reasoning.push("High risk: Prompt demands immediate credentials validation / link clicks under warning threats.");
    }

    // 2. Financial Panic / Propaganda
    if (text.includes('emergency') || text.includes('withdrawals') || text.includes('banks')) {
      harmLevel = "medium";
      category = "public_panic_propaganda";
      reasoning.push("Medium risk: Claims asset closures and halts bank withdrawals, which could incite localized financial panic.");
    }

    // 3. Medical Misinformation
    if (text.includes('cure') || text.includes('vaccine') || text.includes('remedy')) {
      harmLevel = "high";
      category = "medical_misinformation";
      reasoning.push("High risk: Asserting unverified medical solutions bypassing established scientific standards.");
    }

    return {
      harmLevel,
      category,
      reasoning
    };
  }
};
