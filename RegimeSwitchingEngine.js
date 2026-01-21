(function() {
  'use strict';

  const TIP_INDICES = [4, 8, 12, 16, 20];

  function computeConvexHull(points) {
    if (!points || points.length < 3) return points || [];
    const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i -= 1) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  class RegimeSwitchingEngine {
    update(pointsPx, palmWidthPx, handLengthPx, palmCenter) {
      const ratio = palmWidthPx / Math.max(1, handLengthPx);
      const mode = ratio < 0.35 ? 'sideways' : ratio < 0.45 ? 'transition' : 'front';
      const tips = TIP_INDICES.map(idx => pointsPx[idx]);
      return {
        mode,
        modeLabel: mode === 'front' ? 'FRONT-FACING' : mode === 'sideways' ? 'SIDEWAYS' : 'TRANSITION',
        palmLine: { a: pointsPx[5], b: pointsPx[17] },
        palmCenter,
        orientation: { x: pointsPx[9].x - pointsPx[0].x, y: pointsPx[9].y - pointsPx[0].y },
        hull: computeConvexHull(tips.filter(Boolean))
      };
    }
  }

  window.RegimeSwitchingEngine = RegimeSwitchingEngine;
})();
