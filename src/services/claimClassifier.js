/**
 * Truth Guard Claim Classification Router
 * Routes atomic claims into specific context categories for targeted validation.
 */

export const ClaimClassifier = {
  
  /**
   * Classify claim string into routing category
   * @param {string} claim
   * @returns {string} category label
   */
  classify(claim) {
    const text = claim.toLowerCase();

    // Satire indicators generically
    if (text.includes('riding') && (text.includes('dinosaur') || text.includes('unicorn') || text.includes('dragon'))) {
      return 'satire';
    }

    // Historical facts generically
    if (text.includes('president') || text.includes('emperor') || text.includes('king') || text.includes('queen') || text.includes('century') || text.includes('history')) {
      return 'historical_fact';
    }

    // Medical claims
    if (text.includes('cure') || text.includes('vaccine') || text.includes('remedy') || text.includes('health')) {
      return 'medical_claim';
    }

    // Political & Safety-Critical claims
    if (text.includes('emergency') || text.includes('withdrawals') || text.includes('banks')) {
      return 'safety_critical_claim';
    }
    
    // Credentials & Phishing scams (Political/Security)
    if (text.includes('deletion') || text.includes('risk') || text.includes('unauthorized')) {
      return 'political_claim';
    }

    // Default opinion / general statement
    return 'opinion';
  }
};
