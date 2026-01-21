(function() {
  'use strict';

  function renderRegimeSwitchingLayer(ctx, data) {
    if (!data || !data.regime) return;
    const regime = data.regime;
    const center = regime.palmCenter;
    const color = regime.mode === 'front'
      ? '#00ff00'
      : regime.mode === 'sideways'
        ? '#ff0000'
        : '#ff8800';

    if (regime.hull && regime.hull.length > 2) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.moveTo(regime.hull[0].x, regime.hull[0].y);
      for (let i = 1; i < regime.hull.length; i += 1) {
        ctx.lineTo(regime.hull[i].x, regime.hull[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (regime.palmLine) {
      window.DebugDraw.drawLine(ctx, regime.palmLine.a, regime.palmLine.b, color, 4, false, 0.8);
    }

    if (center && regime.orientation) {
      const arrowEnd = { x: center.x + regime.orientation.x * 40, y: center.y + regime.orientation.y * 40 };
      window.DebugDraw.drawArrow(ctx, center, arrowEnd, color, 3);
      window.DebugDraw.drawText(ctx, regime.modeLabel, center.x + 10, center.y - 18, '#ffffff', '12px sans-serif');
    }

    if (regime.mode === 'sideways') {
      window.DebugDraw.drawTextBox(ctx, 'SIMPLIFIED EVALUATION MODE', data.canvas.width / 2, 40, {
        font: '12px sans-serif',
        background: 'rgba(255,0,0,0.7)'
      });
      window.DebugDraw.drawTextBox(ctx, 'REORIENT HAND', data.canvas.width / 2, 62, {
        font: '11px sans-serif',
        background: 'rgba(255,136,0,0.8)'
      });
    }
  }

  window.renderRegimeSwitchingLayer = renderRegimeSwitchingLayer;
})();
