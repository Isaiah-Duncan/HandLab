(function() {
  'use strict';

  function renderScaleNormalizationLayer(ctx, data) {
    if (!data || !data.scale) return;
    const scale = data.scale;

    if (scale.palmLine) {
      window.DebugDraw.drawLine(ctx, scale.palmLine.a, scale.palmLine.b, '#ffffff', 4, false, 0.8);
      window.DebugDraw.drawText(ctx, `Palm width: ${scale.palmWidth.toFixed(0)}px`, scale.palmLine.b.x + 10, scale.palmLine.b.y, '#ffffff', '11px sans-serif');
    }

    if (scale.center) {
      const colors = {
        good: 'rgba(0,255,0,0.2)',
        warn: 'rgba(255,255,0,0.2)',
        bad: 'rgba(255,0,0,0.2)'
      };
      const radii = [80, 120, 160];
      radii.forEach((r, idx) => {
        ctx.save();
        ctx.strokeStyle = idx === 0 ? colors.good : idx === 1 ? colors.warn : colors.bad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(scale.center.x, scale.center.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }

    const scaleLabel = `Scale: ${scale.factor.toFixed(2)}x`;
    const scaleStatus = scale.status === 'good' ? 'NORMAL' : scale.status === 'far' ? 'TOO FAR' : 'TOO CLOSE';
    const color = scale.status === 'good' ? '#00ff88' : scale.status === 'far' ? '#ff0000' : '#ffff00';
    window.DebugDraw.drawTextBox(ctx, `${scaleLabel} - ${scaleStatus}`, data.canvas.width - 160, 70, {
      font: '12px sans-serif',
      background: color,
      border: 'rgba(0,0,0,0.4)'
    });

    if (scale.grid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      scale.grid.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line.a.x, line.a.y);
        ctx.lineTo(line.b.x, line.b.y);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  window.renderScaleNormalizationLayer = renderScaleNormalizationLayer;
})();
