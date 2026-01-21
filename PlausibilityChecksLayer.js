(function() {
  'use strict';

  function renderPlausibilityChecksLayer(ctx, data) {
    if (!data || !data.plausibility) return;
    const plaus = data.plausibility;

    plaus.segments.forEach(seg => {
      window.DebugDraw.drawLine(ctx, seg.a, seg.b, seg.color, 3, false, 0.9);
    });

    plaus.warnings.forEach(warn => {
      window.DebugDraw.drawText(ctx, `WARN: ${warn.text}`, warn.pos.x, warn.pos.y, '#ff8800', '11px sans-serif');
    });

    if (plaus.collinearity) {
      plaus.collinearity.forEach(item => {
        window.DebugDraw.drawText(ctx, `Collinearity: ${Math.round(item.score * 100)}%`, item.pos.x, item.pos.y, '#ffffff', '10px sans-serif');
      });
    }

    window.DebugDraw.drawTextBox(ctx, `Plausibility violations: ${plaus.violations}`, data.canvas.width - 140, data.canvas.height - 60, {
      font: '12px sans-serif',
      background: plaus.violations > 0 ? 'rgba(255,0,0,0.6)' : 'rgba(0,255,0,0.4)'
    });
  }

  window.renderPlausibilityChecksLayer = renderPlausibilityChecksLayer;
})();
