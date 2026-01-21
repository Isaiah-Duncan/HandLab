(function() {
  'use strict';

  class ScaleNormalizationEngine {
    constructor() {
      this.baselinePalm = null;
    }

    update(palmWidthPx, palmCenter, pointsPx, canvasW, canvasH) {
      if (!this.baselinePalm) {
        this.baselinePalm = palmWidthPx;
      } else {
        this.baselinePalm = this.baselinePalm * 0.98 + palmWidthPx * 0.02;
      }

      const scaleFactor = palmWidthPx / Math.max(1, this.baselinePalm);
      const scaleStatus = scaleFactor < 0.75 ? 'far' : scaleFactor > 1.3 ? 'close' : 'good';
      const grid = [];
      for (let i = 0; i < 6; i += 1) {
        const x = (canvasW / 6) * i;
        grid.push({ a: { x, y: 0 }, b: { x, y: canvasH } });
      }

      return {
        palmWidth: palmWidthPx,
        factor: scaleFactor,
        status: scaleStatus,
        center: palmCenter,
        palmLine: { a: pointsPx[5], b: pointsPx[17] },
        grid
      };
    }
  }

  window.ScaleNormalizationEngine = ScaleNormalizationEngine;
})();
