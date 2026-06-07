/**
 * Truth Guard Evidence Graph
 * Implements a serializable node-edge graph model linking Canonical Assets,
 * Forensic Observations, Semantic Claims, External Sources, and final Calibrated Verdicts.
 */

export class EvidenceGraph {
  constructor(assetId) {
    this.nodes = [];
    this.edges = [];
    this.rootAssetId = assetId;

    // Add root node
    this.addNode(assetId, 'Asset', { label: 'Canonical Media Asset' });
  }

  addNode(id, type, properties = {}) {
    if (this.nodes.some(n => n.id === id)) return;
    this.nodes.push({ id, type, properties });
  }

  addEdge(sourceId, targetId, relationType) {
    const edgeId = `${sourceId}-${relationType}-${targetId}`;
    if (this.edges.some(e => e.id === edgeId)) return;
    this.edges.push({ id: edgeId, source: sourceId, target: targetId, relation: relationType });
  }

  /**
   * Build complete graph from AnalysisReport state
   * @param {Object} report
   * @returns {Object} serialized graph payload
   */
  static buildFromReport(report) {
    const graph = new EvidenceGraph(report.id);

    // 1. Map observations
    if (report.observations) {
      report.observations.forEach((obs, index) => {
        const nodeId = `obs-${index}`;
        graph.addNode(nodeId, 'Observation', { label: obs.detail, confidence: obs.confidence });
        graph.addEdge(report.id, nodeId, 'HAS_OBSERVATION');
      });
    }

    // 2. Map claims
    if (report.claims) {
      report.claims.forEach((claim, index) => {
        const nodeId = `claim-${index}`;
        graph.addNode(nodeId, 'Claim', { text: claim.text, category: claim.category });
        graph.addEdge(report.id, nodeId, 'ASSERTS_CLAIM');
      });
    }

    // 3. Map contradictions
    if (report.contradictions) {
      report.contradictions.forEach((con, index) => {
        const nodeId = `con-${index}`;
        graph.addNode(nodeId, 'Contradiction', { detail: con.contradiction, severity: con.severity });
        graph.addEdge(report.id, nodeId, 'HAS_CONTRADICTION');
      });
    }

    // 4. Map sources
    if (report.sources) {
      report.sources.forEach((src) => {
        graph.addNode(src.id, 'Source', { name: src.source, url: src.url });
        // Link source to the root asset
        graph.addEdge(report.id, src.id, 'SUPPORTED_BY');
      });
    }

    return {
      nodes: graph.nodes,
      edges: graph.edges
    };
  }
}
