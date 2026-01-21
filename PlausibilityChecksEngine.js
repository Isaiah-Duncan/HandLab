(function() {
  'use strict';

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  class PlausibilityChecksEngine {
    constructor() {
      this.lastBoneLengths = [];
    }

    update(pointsPx, palmWidthPx) {
      const segments = [];
      const warnings = [];
      const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [0,9],[9,10],[10,11],[11,12],
        [0,13],[13,14],[14,15],[15,16],
        [0,17],[17,18],[18,19],[19,20]
      ];
      let violations = 0;

      connections.forEach(([a, b], idx) => {
        const length = dist(pointsPx[a], pointsPx[b]) / Math.max(1, palmWidthPx);
        const prev = this.lastBoneLengths[idx] || length;
        const delta = Math.abs(length - prev) / prev;
        const color = delta > 0.1 ? '#ff0000' : delta > 0.05 ? '#ff8800' : '#00ff88';
        if (delta > 0.1) violations += 1;
        this.lastBoneLengths[idx] = length;
        segments.push({ a: pointsPx[a], b: pointsPx[b], color });
      });

      return {
        segments,
        warnings,
        collinearity: [
          { score: 0.92, pos: { x: pointsPx[8].x + 8, y: pointsPx[8].y } },
          { score: 0.85, pos: { x: pointsPx[12].x + 8, y: pointsPx[12].y } }
        ],
        violations
      };
    }
  }

  window.PlausibilityChecksEngine = PlausibilityChecksEngine;
})();
