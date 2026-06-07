/**
 * Truth Guard Media Memory Graph
 * Tracks narrative and structural links between previously ingested assets to trace media reuse.
 */

class MediaMemoryGraphClass {
  constructor() {
    this.nodes = new Map(); // id -> metadata
    this.edges = []; // [{ from, to, relation, weight }]
  }

  /**
   * Register new asset node in memory graph
   * @param {string} id
   * @param {Object} metadata
   */
  addNode(id, metadata = {}) {
    this.nodes.set(id, {
      ...metadata,
      registeredAt: Date.now()
    });
  }

  /**
   * Link two assets together semantic-wise
   * @param {string} fromId
   * @param {string} toId
   * @param {string} relation - 'identical_copy' | 'narrative_reuse' | 'shared_entity'
   * @param {number} weight - strength of match (0.0 to 1.0)
   */
  addEdge(fromId, toId, relation, weight = 1.0) {
    // Avoid duplicates
    const exists = this.edges.some(e => 
      e.from === fromId && e.to === toId && e.relation === relation
    );
    if (!exists) {
      this.edges.push({
        from: fromId,
        to: toId,
        relation,
        weight,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Find matches for a specific node in graph
   * @param {string} id
   * @returns {Array<Object>} matching connections
   */
  findDuplicates(id) {
    const connections = [];
    
    this.edges.forEach(edge => {
      if (edge.from === id) {
        connections.push({
          targetId: edge.to,
          relation: edge.relation,
          weight: edge.weight,
          metadata: this.nodes.get(edge.to)
        });
      } else if (edge.to === id) {
        connections.push({
          targetId: edge.from,
          relation: edge.relation,
          weight: edge.weight,
          metadata: this.nodes.get(edge.from)
        });
      }
    });

    return connections.sort((a, b) => b.weight - a.weight);
  }
}

export const MediaMemoryGraph = new MediaMemoryGraphClass();
export default MediaMemoryGraph;
