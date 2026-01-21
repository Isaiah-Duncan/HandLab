(() => {
  'use strict';

  const FINGER_JOINTS = [
    [1, 2, 3, 4],   // Thumb
    [5, 6, 7, 8],   // Index
    [9, 10, 11, 12],// Middle
    [13, 14, 15, 16],// Ring
    [17, 18, 19, 20] // Pinky
  ];

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function angleDeg(a, b, c) {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y) || 1;
    const cos = Math.max(-1, Math.min(1, dot / mag));
    return Math.acos(cos) * (180 / Math.PI);
  }

  class DeadFingerEngine {
    constructor() {
      this.jointHistory = Array.from({ length: 21 }, () => []);
      this.lastGoodJoint = Array(21).fill(null);
      this.segmentScores = Array.from({ length: 5 }, () => [0, 0, 0]);
      this.reviveUntil = Array(5).fill(0);
    }

    update(rawLm, toPx, observation, now) {
      const pointsPx = rawLm.map(toPx);
      const palmWidth = dist(pointsPx[5], pointsPx[17]) || 1;

      const jointConfidence = pointsPx.map((pt, idx) => {
        const history = this.jointHistory[idx];
        history.push({ x: pt.x, y: pt.y });
        while (history.length > 8) history.shift();
        let jitter = 0;
        if (history.length > 1) {
          const avg = history.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
          avg.x /= history.length;
          avg.y /= history.length;
          jitter = history.reduce((sum, p) => sum + dist(p, avg), 0) / history.length;
        }
        const confidence = clamp01(1 - (jitter / (palmWidth * 0.1)));
        if (confidence > 0.6) {
          this.lastGoodJoint[idx] = { x: pt.x, y: pt.y };
        }
        return confidence;
      });

      const perFinger = FINGER_JOINTS.map((joints, fingerIdx) => {
        const segments = [];
        const scores = this.segmentScores[fingerIdx];

        for (let s = 0; s < joints.length - 1; s += 1) {
          const aIdx = joints[s];
          const bIdx = joints[s + 1];
          const cIdx = joints[s + 2];
          const confA = jointConfidence[aIdx];
          const confB = jointConfidence[bIdx];
          const observedA = confA >= 0.6;
          const observedB = confB >= 0.6;
          const visibleA = confA >= 0.4;
          const visibleB = confB >= 0.4;

          let bent = false;
          if (cIdx !== undefined && visibleB) {
            const ang = angleDeg(pointsPx[aIdx], pointsPx[bIdx], pointsPx[cIdx]);
            bent = ang < 150;
          }

          let score = scores[s];
          if (observedA && observedB) {
            score -= 0.12;
          } else if (!visibleA && !visibleB) {
            score += 0.25;
          } else if (!visibleA && visibleB && bent) {
            score += 0.18;
          } else if (!visibleA && visibleB) {
            score += 0.1;
          } else {
            score += 0.02;
          }
          score = clamp01(score);
          scores[s] = score;

          const state = score > 0.7 ? 'dead' : score > 0.4 ? 'ghost' : 'alive';
          const currentA = pointsPx[aIdx];
          const currentB = pointsPx[bIdx];
          const lockedA = this.lastGoodJoint[aIdx] || currentA;
          const lockedB = this.lastGoodJoint[bIdx] || currentB;

          segments.push({
            state,
            score,
            aIndex: aIdx,
            bIndex: bIdx,
            currentA,
            currentB,
            lockedA,
            lockedB,
            confidenceA: confA,
            confidenceB: confB
          });
        }

        const maxScore = Math.max(...scores);
        if (maxScore > 0.7) {
          this.reviveUntil[fingerIdx] = now + 600;
        }
        const reviving = this.reviveUntil[fingerIdx] > now && maxScore < 0.4;
        const state = maxScore > 0.7 ? 'dead' : maxScore > 0.4 ? 'ghost' : 'alive';

        return {
          state,
          segments,
          reviving,
          reviveSeconds: Math.max(0, (this.reviveUntil[fingerIdx] - now) / 1000)
        };
      });

      return { perFinger, pointsPx };
    }
  }

  window.DeadFingerEngine = DeadFingerEngine;
})();
