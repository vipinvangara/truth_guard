/**
 * Truth Guard Local Audit Store
 * Persists finalized authenticity records (AnalysisReport) in a secure, local-first
 * registry. Encapsulates evidence data, model checksum configurations, and decisions.
 */

// Memory database backend (syncs to AsyncStorage / local storage if available)
let auditLogs = [];

export const AuditStore = {
  
  /**
   * Save an authenticity verification report to the local audit vault
   * @param {string} assetHash - SHA-256 hash of the verification item
   * @param {string} modelVersion - String ID representing model config version
   * @param {Array} evidence - Array of gathered EvidenceReference objects
   * @param {Object} report - Complete AnalysisReport object
   */
  async saveRecord(assetHash, modelVersion, evidence, report) {
    const record = {
      assetHash,
      timestamp: Date.now(),
      modelVersion,
      evidence,
      report
    };

    // Prevent duplicates
    auditLogs = auditLogs.filter(log => log.assetHash !== assetHash);
    auditLogs.unshift(record);

    // Sync to window.localStorage in web context
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('truth_guard_audit_store', JSON.stringify(auditLogs));
      } catch (err) {
        console.error("Local Storage sync failed:", err);
      }
    }
    return record;
  },

  /**
   * Fetch all records in the audit vault
   * @returns {Array}
   */
  async getRecords() {
    if (auditLogs.length === 0 && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('truth_guard_audit_store');
        if (stored) {
          auditLogs = JSON.parse(stored);
        }
      } catch (err) {
        console.error("Failed to read audit store from Local Storage:", err);
      }
    }
    return auditLogs;
  },

  /**
   * Fetch record by asset hash
   * @param {string} hash
   * @returns {Object|null}
   */
  async getRecordByHash(hash) {
    const records = await this.getRecords();
    return records.find(r => r.assetHash === hash) || null;
  },

  /**
   * Clear audit ledger records
   */
  async purgeStore() {
    auditLogs = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('truth_guard_audit_store');
    }
  }
};
