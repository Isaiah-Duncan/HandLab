(function() {
  'use strict';

  function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function drawStateMachine(ctx, states, current, x, y) {
    const width = 62;
    const height = 20;
    const gap = 6;
    states.forEach((state, idx) => {
      const sx = x + idx * (width + gap);
      const active = state === current;
      ctx.save();
      ctx.fillStyle = active ? 'rgba(136,68,255,0.8)' : 'rgba(255,255,255,0.12)';
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      roundRectPath(ctx, sx, y, width, height, 6);
      ctx.fill();
      ctx.stroke();
      window.DebugDraw.drawText(ctx, state.toUpperCase(), sx + width / 2, y + height / 2, '#ffffff', '10px sans-serif', 'center');
      ctx.restore();
    });
  }

  function renderTimeGatingLayer(ctx, data) {
    if (!data || !data.timeGate) return;
    const gate = data.timeGate;
    const center = data.palmCenter;

    if (center) {
      window.DebugDraw.drawRing(ctx, center, 52, gate.progress, '#8844ff', 'rgba(255,255,255,0.1)');
      window.DebugDraw.drawText(ctx, `${gate.remaining.toFixed(1)}s`, center.x, center.y, '#ffffff', '16px sans-serif', 'center');
    }

    drawStateMachine(ctx, ['idle', 'qualify', 'count', 'paused', 'passed'], gate.state, 20, data.canvas.height - 32);

    window.DebugDraw.drawText(ctx, `Stable: ${gate.stable.toFixed(1)}s / ${gate.required.toFixed(1)}s`, 20, data.canvas.height - 52, '#ffffff', '11px sans-serif');

    if (gate.paused) {
      window.DebugDraw.drawTextBox(ctx, 'PAUSED: Reposition hand', data.canvas.width / 2, data.canvas.height / 2 - 80, {
        font: '12px sans-serif',
        background: 'rgba(255,255,255,0.2)'
      });
      window.DebugDraw.drawText(ctx, `Resume in: ${gate.pauseRemaining.toFixed(1)}s`, data.canvas.width / 2, data.canvas.height / 2 - 60, '#ffffff', '12px sans-serif', 'center');
    }

    if (gate.mercyRemaining > 0) {
      window.DebugDraw.drawText(ctx, `Mercy active: ${gate.mercyRemaining.toFixed(1)}s`, data.canvas.width / 2, data.canvas.height / 2 + 70, '#ffcc88', '12px sans-serif', 'center');
    }
  }

  window.renderTimeGatingLayer = renderTimeGatingLayer;
})();
