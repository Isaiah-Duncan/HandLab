(function() {
  'use strict';

  const TIP_INDICES = [4, 8, 12, 16, 20];
  const FINGER_LABELS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function avgPoint(points) {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  class ObservationThresholdsEngine {
    constructor() {
      this.tipHistory = Array.from({ length: 5 }, () => []);
    }

    update(rawLm, toPx) {
      const tips = TIP_INDICES.map(idx => toPx(rawLm[idx]));
      const palmWidth = dist(toPx(rawLm[5]), toPx(rawLm[17]));

      tips.forEach((tip, idx) => {
        const history = this.tipHistory[idx];
        history.push({ x: tip.x, y: tip.y });
        while (history.length > 10) history.shift();
      });

      const perFinger = tips.map((tip, idx) => {
        const history = this.tipHistory[idx];
        let jitter = 0;
        if (history.length > 1) {
          const center = avgPoint(history);
          jitter = history.reduce((sum, p) => sum + dist(p, center), 0) / history.length;
        }
        let occlusionPenalty = 0;
        tips.forEach((other, jdx) => {
          if (jdx !== idx && dist(other, tip) < palmWidth * 0.08) {
            occlusionPenalty = 0.2;
          }
        });
        const scalePenalty = palmWidth < 80 ? 0.3 : 0;
        const confidence = Math.max(0, Math.min(1, 1 - (jitter / (palmWidth * 0.12)) - occlusionPenalty - scalePenalty));
        const state = confidence > 0.7 ? 'observed' : confidence > 0.4 ? 'less' : 'unobservable';
        return {
          name: FINGER_LABELS[idx],
          state,
          confidence,
          jitter
        };
      });

      const globalState = perFinger.some(f => f.state === 'unobservable')
        ? 'unobservable'
        : perFinger.some(f => f.state === 'less') ? 'less' : 'observed';

      return {
        perFinger,
        globalState,
        tips,
        histories: this.tipHistory
      };
    }
  }

  window.ObservationThresholdsEngine = ObservationThresholdsEngine;
})();
