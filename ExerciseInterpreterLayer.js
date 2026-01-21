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

  function renderExerciseInterpreterLayer(ctx, data) {
    if (!data || !data.interpreter) return;
    const panelX = 20;
    const panelY = data.canvas.height * 0.32;
    const panelW = 240;
    const panelH = 180;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    roundRectPath(ctx, panelX, panelY, panelW, panelH, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    window.DebugDraw.drawText(ctx, 'Exercise Interpreter', panelX + 12, panelY + 16, '#ffffff', '12px sans-serif');

    const constraints = data.interpreter.constraints || [];
    constraints.forEach((item, idx) => {
      const y = panelY + 36 + idx * 18;
      const mark = item.ok ? '[OK]' : '[X]';
      const color = item.ok ? '#00ff88' : '#ff8800';
      window.DebugDraw.drawText(ctx, `${mark} ${item.label}`, panelX + 12, y, color, '11px sans-serif');
      if (typeof item.progress === 'number') {
        window.DebugDraw.drawBar(ctx, panelX + 130, y - 6, 90, 6, item.progress, color, 'rgba(255,255,255,0.1)');
      }
    });

    if (data.interpreter.intent && data.interpreter.intent.arrow) {
      const arrow = data.interpreter.intent.arrow;
      window.DebugDraw.drawArrow(ctx, arrow.from, arrow.to, '#4488ff', 2);
      window.DebugDraw.drawText(ctx, `Attempting: ${data.interpreter.intent.label}`, arrow.from.x, arrow.from.y - 12, '#ffffff', '11px sans-serif');
    }
  }

  window.renderExerciseInterpreterLayer = renderExerciseInterpreterLayer;
})();
