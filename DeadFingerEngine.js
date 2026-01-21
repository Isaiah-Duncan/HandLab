(function() {
  'use strict';

  const TIP_INDICES = [4, 8, 12, 16, 20];

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  class DeadFingerEngine {
    constructor() {
      this.deadCounters = Array(5).fill(0);
      this.lastGoodTips = Array(5).fill(null);
      this.reviveUntil = Array(5).fill(0);
    }

    update(observation, now) {
      const perFinger = [];
      observation.perFinger.forEach((finger, idx) => {
        if (finger.confidence < 0.25) {
          this.deadCounters[idx] += 1;
        } else {
          this.deadCounters[idx] = Math.max(0, this.deadCounters[idx] - 1);
        }

        if (finger.confidence > 0.6) {
          this.lastGoodTips[idx] = observation.tips[idx];
        }

        if (this.deadCounters[idx] > 6) {
          this.reviveUntil[idx] = now + 600;
        }

        const reviving = this.reviveUntil[idx] > now && finger.confidence > 0.5;
        const state = this.deadCounters[idx] > 6
          ? 'dead'
          : finger.state === 'less' ? 'ghost' : 'alive';

        perFinger.push({
          state,
          current: observation.tips[idx],
          lastGood: this.lastGoodTips[idx],
          reviving,
          reviveSeconds: Math.max(0, (this.reviveUntil[idx] - now) / 1000)
        });
      });

      return { perFinger };
    }
  }

  window.DeadFingerEngine = DeadFingerEngine;
})();
