(function() {
  'use strict';

  function renderDeadFingerLayer(ctx, data) {
    if (!data || !data.dead || !data.pointsPx) return;
    const dead = data.dead;

    dead.perFinger.forEach((fingerState, idx) => {
      const segments = fingerState.segments || [];
      segments.forEach(segment => {
        const deadColor = '#ff0000';
        const ghostColor = 'rgba(255,255,255,0.5)';
        const aliveColor = '#00ff00';

        if (segment.state === 'dead') {
          window.DebugDraw.drawLine(ctx, segment.lockedA, segment.lockedB, deadColor, 3, false, 0.9);
          window.DebugDraw.drawLine(ctx, segment.currentA, segment.currentB, ghostColor, 2, true, 0.6);
        } else if (segment.state === 'ghost') {
          window.DebugDraw.drawLine(ctx, segment.currentA, segment.currentB, ghostColor, 2, true, 0.7);
        } else {
          window.DebugDraw.drawLine(ctx, segment.currentA, segment.currentB, aliveColor, 3, false, 0.8);
        }
      });

      const tipSegment = segments[segments.length - 1];
      const tip = tipSegment ? tipSegment.currentB : null;
      if (tip && fingerState.state !== 'alive') {
        window.DebugDraw.drawText(ctx, 'QUARANTINED', tip.x + 12, tip.y - 12, '#ffcccc', '10px sans-serif');
      }

      if (fingerState.reviving && tip) {
        window.DebugDraw.drawText(ctx, `Reviving in: ${fingerState.reviveSeconds.toFixed(1)}s`, tip.x + 10, tip.y + 10, '#ffffff', '10px sans-serif');
      }
    });
  }

  window.renderDeadFingerLayer = renderDeadFingerLayer;
})();
