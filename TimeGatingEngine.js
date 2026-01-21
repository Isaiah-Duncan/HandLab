(function() {
  'use strict';

  class TimeGatingEngine {
    constructor() {
      this.stableSince = null;
      this.mercyUntil = 0;
      this.pauseUntil = 0;
    }

    update(mode, globalState, appState, now) {
      const stable = mode === 'front' && globalState === 'observed';
      if (stable) {
        if (!this.stableSince) this.stableSince = now;
      } else {
        this.stableSince = null;
        this.mercyUntil = now + 300;
      }
      const stableMs = this.stableSince ? (now - this.stableSince) : 0;
      const requiredMs = 1500;
      const progress = Math.min(1, stableMs / requiredMs);
      return {
        state: appState.paused ? 'paused' : stable ? 'count' : appState.running ? 'qualify' : 'idle',
        progress,
        stable: stableMs / 1000,
        required: requiredMs / 1000,
        remaining: Math.max(0, (requiredMs - stableMs) / 1000),
        paused: appState.paused,
        pauseRemaining: Math.max(0, (this.pauseUntil - now) / 1000),
        mercyRemaining: Math.max(0, (this.mercyUntil - now) / 1000)
      };
    }
  }

  window.TimeGatingEngine = TimeGatingEngine;
})();
