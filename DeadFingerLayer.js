(function() {
  'use strict';

  const FINGER_CHAINS = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20]
  ];

  function renderDeadFingerLayer(ctx, data) {
    if (!data || !data.dead || !data.pointsPx) return;
    const dead = data.dead;

    dead.perFinger.forEach((fingerState, idx) => {
      const chain = FINGER_CHAINS[idx];
      const color = fingerState.state === 'dead'
        ? '#ff0000'
        : fingerState.state === 'ghost'
          ? 'rgba(255,255,255,0.5)'
          : '#00ff00';
      const dashed = fingerState.state !== 'alive';

      for (let i = 0; i < chain.length - 1; i += 1) {
        const a = data.pointsPx[chain[i]];
        const b = data.pointsPx[chain[i + 1]];
        if (!a || !b) continue;
        window.DebugDraw.drawLine(ctx, a, b, color, 3, dashed, 0.8);
      }

      const tip = data.pointsPx[chain[chain.length - 1]];
      if (tip && fingerState.state !== 'alive') {
        window.DebugDraw.drawText(ctx, 'QUARANTINED', tip.x + 12, tip.y - 12, '#ffcccc', '10px sans-serif');
      }

      if (fingerState.lastGood && fingerState.current) {
        window.DebugDraw.drawLine(ctx, fingerState.lastGood, fingerState.current, '#ffffff', 2, false, 0.6);
        window.DebugDraw.drawLine(ctx, fingerState.current, fingerState.lastGood, '#ffffff', 2, true, 0.6);
      }

      if (fingerState.reviving && tip) {
        window.DebugDraw.drawText(ctx, `Reviving in: ${fingerState.reviveSeconds.toFixed(1)}s`, tip.x + 10, tip.y + 10, '#ffffff', '10px sans-serif');
      }
    });
  }

  window.renderDeadFingerLayer = renderDeadFingerLayer;
})();
