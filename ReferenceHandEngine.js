(function() {
  'use strict';

  const TIP_INDICES = [4, 8, 12, 16, 20];
  const FINGER_LABELS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  class ReferenceHandEngine {
    constructor() {
      this.referenceLm = null;
    }

    update(pointsPx, palmWidthPx) {
      if (!this.referenceLm) {
        this.referenceLm = pointsPx.map(p => ({ x: p.x, y: p.y }));
      }
      const tips = TIP_INDICES.map(idx => pointsPx[idx]);
      const correspondence = [];
      const perFinger = [];
      let totalScore = 0;

      for (let i = 0; i < tips.length; i += 1) {
        const refTip = this.referenceLm[TIP_INDICES[i]];
        const curTip = tips[i];
        if (!refTip || !curTip) continue;
        const deviation = dist(refTip, curTip) / Math.max(1, palmWidthPx);
        const score = Math.max(0, 1 - deviation * 2.5);
        totalScore += score;
        const color = score > 0.8 ? '#00ff88' : score > 0.6 ? '#ffff00' : '#ff0000';
        correspondence.push({ from: curTip, to: refTip, color });
        perFinger.push({ name: FINGER_LABELS[i], score, pos: { x: curTip.x + 6, y: curTip.y - 6 }, color });
      }

      const overall = perFinger.length ? totalScore / perFinger.length : 0;
      return {
        referenceLm: this.referenceLm,
        correspondence,
        perFinger,
        overall
      };
    }
  }

  window.ReferenceHandEngine = ReferenceHandEngine;
})();
