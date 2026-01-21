(function() {
  'use strict';

  const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17]
  ];

  function renderReferenceHandLayer(ctx, data) {
    if (!data || !data.reference || !data.reference.referenceLm) return;
    const ref = data.reference;

    CONNECTIONS.forEach(([a, b]) => {
      const pa = ref.referenceLm[a];
      const pb = ref.referenceLm[b];
      if (!pa || !pb) return;
      window.DebugDraw.drawLine(ctx, pa, pb, 'rgba(0,255,136,0.4)', 3, false, 0.7);
    });

    (ref.correspondence || []).forEach(link => {
      window.DebugDraw.drawLine(ctx, link.from, link.to, link.color, 2, false, 0.8);
    });

    (ref.perFinger || []).forEach(item => {
      window.DebugDraw.drawText(ctx, `${item.name}: ${Math.round(item.score * 100)}%`, item.pos.x, item.pos.y, item.color, '11px sans-serif');
    });

    if (ref.overall) {
      window.DebugDraw.drawRing(ctx, { x: data.canvas.width - 80, y: data.canvas.height - 90 }, 32, ref.overall, '#00ff88', 'rgba(255,255,255,0.1)');
      window.DebugDraw.drawText(ctx, `Match: ${Math.round(ref.overall * 100)}%`, data.canvas.width - 80, data.canvas.height - 40, '#ffffff', '11px sans-serif', 'center');
    }
  }

  window.renderReferenceHandLayer = renderReferenceHandLayer;
})();
