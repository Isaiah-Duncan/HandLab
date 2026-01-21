(() => {
  'use strict';

  function drawGrid(ctx, grid) {
    const size = grid.size;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= grid.width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, grid.height);
      ctx.stroke();
    }
    for (let y = 0; y <= grid.height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(grid.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function renderSemanticLogicLayer(ctx, data) {
    if (!data || !data.semantic) return;
    const sem = data.semantic;

    drawGrid(ctx, sem.grid);

    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, sem.denialLines.primaryY);
    ctx.lineTo(sem.grid.width, sem.denialLines.primaryY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#f97316';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, sem.denialLines.secondaryY);
    ctx.lineTo(sem.grid.width, sem.denialLines.secondaryY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    sem.projections.forEach(line => {
      const alpha = line.isTarget ? 0.9 : 0.25;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.isTarget ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(line.from.x, line.from.y);
      ctx.lineTo(line.to.x, line.to.y);
      ctx.stroke();
      ctx.restore();
    });

    sem.countedSquares.forEach(square => {
      ctx.save();
      ctx.fillStyle = square.color;
      ctx.globalAlpha = square.active ? 0.35 : square.isTarget ? 0.15 : 0.08;
      ctx.fillRect(square.x, square.y, square.size, square.size);
      ctx.restore();
    });

    sem.tips.forEach(tip => {
      ctx.save();
      ctx.fillStyle = tip.color;
      ctx.globalAlpha = tip.isTarget ? 0.9 : 0.4;
      ctx.beginPath();
      ctx.arc(tip.point.x, tip.point.y, tip.isTarget ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(sem.palmCenter.x, sem.palmCenter.y - 10);
    ctx.lineTo(sem.palmCenter.x - 10, sem.palmCenter.y + 10);
    ctx.lineTo(sem.palmCenter.x + 10, sem.palmCenter.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  window.renderSemanticLogicLayer = renderSemanticLogicLayer;
})();
