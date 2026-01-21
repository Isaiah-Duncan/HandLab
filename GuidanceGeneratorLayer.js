(function() {
  'use strict';

  function renderGuidanceGeneratorLayer(ctx, data) {
    if (!data || !data.guidance) return;
    const guidance = data.guidance;

    if (guidance.prompt && guidance.prompt.pos) {
      window.DebugDraw.drawTextBox(ctx, guidance.prompt.text, guidance.prompt.pos.x, guidance.prompt.pos.y, {
        font: '13px sans-serif',
        background: 'rgba(68,136,255,0.7)'
      });
    }

    (guidance.targets || []).forEach(target => {
      window.DebugDraw.drawCircle(ctx, target.x, target.y, 10, 'rgba(68,136,255,0.2)', '#4488ff', 2, 1);
    });

    (guidance.lines || []).forEach(line => {
      window.DebugDraw.drawLine(ctx, line.from, line.to, '#4488ff', 2, true, 0.7);
    });

    (guidance.arrows || []).forEach(arrow => {
      window.DebugDraw.drawArrow(ctx, arrow.from, arrow.to, '#4488ff', 2);
      if (arrow.label) {
        window.DebugDraw.drawText(ctx, arrow.label, arrow.to.x + 6, arrow.to.y - 6, '#ffffff', '11px sans-serif');
      }
    });
  }

  window.renderGuidanceGeneratorLayer = renderGuidanceGeneratorLayer;
})();
