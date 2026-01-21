(() => {
  'use strict';

  function renderActiveIlluminationLayer(ctx, data) {
    if (!data || !data.activeIllumination) return;
    const ai = data.activeIllumination;

    const w = ai.canvasSize.width;
    const h = ai.canvasSize.height;
    const band = w / 3;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(0, 0, band, h);
    ctx.fillStyle = '#00ff66';
    ctx.fillRect(band, 0, band, h);
    ctx.fillStyle = '#3366ff';
    ctx.fillRect(band * 2, 0, band, h);

    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, 'rgba(255,0,80,0.45)');
    gradient.addColorStop(0.5, 'rgba(0,255,140,0.3)');
    gradient.addColorStop(1, 'rgba(60,120,255,0.45)');
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const pw = ai.previewSize.width;
    const ph = ai.previewSize.height;
    const margin = 10;
    const startX = w - (pw * 2 + margin * 3);
    const startY = h - (ph * 2 + margin * 3);

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(ai.previews.r, startX, startY, pw, ph);
    ctx.drawImage(ai.previews.g, startX + pw + margin, startY, pw, ph);
    ctx.drawImage(ai.previews.b, startX, startY + ph + margin, pw, ph);
    ctx.drawImage(ai.previews.n, startX + pw + margin, startY + ph + margin, pw, ph);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX - 2, startY - 2, pw * 2 + margin + 4, ph * 2 + margin + 4);
    ctx.restore();
  }

  window.renderActiveIlluminationLayer = renderActiveIlluminationLayer;
})();
