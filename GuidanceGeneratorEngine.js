(function() {
  'use strict';

  class GuidanceGeneratorEngine {
    update(scaleStatus, mode, palmCenter, tips) {
      return {
        prompt: {
          text: scaleStatus === 'far' ? 'Move hand closer'
            : scaleStatus === 'close' ? 'Move hand back'
              : mode === 'sideways' ? 'Rotate palm forward'
                : 'Maintain posture',
          pos: { x: palmCenter.x, y: palmCenter.y - 80 }
        },
        targets: tips.slice(1).map(t => ({ x: t.x, y: t.y })),
        lines: tips.slice(1).map(t => ({ from: palmCenter, to: t })),
        arrows: mode === 'sideways'
          ? [{ from: palmCenter, to: { x: palmCenter.x + 50, y: palmCenter.y }, label: 'Rotate' }]
          : []
      };
    }
  }

  window.GuidanceGeneratorEngine = GuidanceGeneratorEngine;
})();
