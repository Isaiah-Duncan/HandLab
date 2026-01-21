(function() {
  'use strict';

  const COLORS = {
    observed: '#00ff00',
    less: '#ffff00',
    unobservable: '#ff0000'
  };

  function renderObservationThresholdsLayer(ctx, data) {
    if (!data || !data.observation) return;
    const obs = data.observation;
    const tips = obs.tips || [];
    const histories = obs.histories || [];

    // Jitter trails
    histories.forEach((trail, idx) => {
      const color = COLORS[(obs.perFinger[idx] || {}).state] || '#ffffff';
      if (trail && trail.length > 1) {
        window.DebugDraw.drawDashedPolyline(ctx, trail, color, 2, 0.35);
      }
    });

    // Per-finger tip indicators
    obs.perFinger.forEach((finger, idx) => {
      const tip = tips[idx];
      if (!tip) return;
      const color = COLORS[finger.state] || '#ffffff';
      window.DebugDraw.drawCircle(ctx, tip.x, tip.y, 6, color, '#000000', 1, 0.9);
    });

    // Global state indicator
    const globalColor = COLORS[obs.globalState] || '#ffffff';
    window.DebugDraw.drawTextBox(
      ctx,
      `Hand Tracking: ${obs.globalState.toUpperCase()}`,
      data.canvas.width - 170,
      32,
      {
        font: '12px sans-serif',
        color: '#ffffff',
        background: globalColor,
        border: 'rgba(0,0,0,0.4)'
      }
    );

    // Confidence meters
    const panelX = data.canvas.width - 170;
    const startY = 60;
    obs.perFinger.forEach((finger, idx) => {
      const label = finger.name || `Finger ${idx}`;
      const y = startY + idx * 18;
      window.DebugDraw.drawText(ctx, label, panelX, y, '#ffffff', '11px sans-serif');
      window.DebugDraw.drawBar(ctx, panelX + 70, y - 6, 80, 8, finger.confidence || 0, globalColor, 'rgba(255,255,255,0.1)');
    });
  }

  window.renderObservationThresholdsLayer = renderObservationThresholdsLayer;
})();
