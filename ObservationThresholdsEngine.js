(function() {
  'use strict';

  const TIP_INDICES = [4, 8, 12, 16, 20];
  const FINGER_LABELS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  const FINGER_JOINTS = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20]
  ];

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
      this.lengthBaseline = Array(5).fill(null);
    }

    update(rawLm, toPx) {
      const pointsPx = rawLm.map(toPx);
      const tips = TIP_INDICES.map(idx => pointsPx[idx]);
      const palmWidth = dist(pointsPx[5], pointsPx[17]) || 1;
      const handLength = dist(pointsPx[0], pointsPx[12]) || 1;
      const tiltRatio = palmWidth / handLength;

      tips.forEach((tip, idx) => {
        const history = this.tipHistory[idx];
        history.push({ x: tip.x, y: tip.y });
        while (history.length > 10) history.shift();
      });

      const perFinger = tips.map((tip, idx) => {
        const joints = FINGER_JOINTS[idx];
        let fingerLength = 0;
        for (let i = 0; i < joints.length - 1; i += 1) {
          fingerLength += dist(pointsPx[joints[i]], pointsPx[joints[i + 1]]);
        }
        const lengthNorm = fingerLength / palmWidth;
        const baseline = this.lengthBaseline[idx];
        if (baseline === null) {
          this.lengthBaseline[idx] = lengthNorm;
        }

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
        const tiltPenalty = tiltRatio < 0.45 ? 0.12 : tiltRatio < 0.55 ? 0.06 : 0;
        let lengthPenalty = 0;
        if (baseline !== null) {
          const ratio = lengthNorm / baseline;
          if (ratio < 0.7) {
            lengthPenalty = 0.18;
          } else if (ratio < 0.85) {
            lengthPenalty = 0.08;
          }
          if (ratio > 0.9 && occlusionPenalty > 0) {
            occlusionPenalty = Math.max(0, occlusionPenalty - 0.08);
          }
          if (ratio > 0.95 && tiltPenalty > 0) {
            tiltPenalty = Math.max(0, tiltPenalty - 0.04);
          }
        }

        const confidence = Math.max(
          0,
          Math.min(1, 1 - (jitter / (palmWidth * 0.12)) - occlusionPenalty - scalePenalty - tiltPenalty - lengthPenalty)
        );
        const state = confidence > 0.7 ? 'observed' : confidence > 0.4 ? 'less' : 'unobservable';

        if (confidence > 0.75 && occlusionPenalty === 0 && tiltPenalty < 0.05) {
          this.lengthBaseline[idx] = this.lengthBaseline[idx] * 0.92 + lengthNorm * 0.08;
        }

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
