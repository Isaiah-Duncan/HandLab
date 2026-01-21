(function() {
  'use strict';

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function drawCircle(ctx, x, y, r, fill, stroke, lineWidth, alpha) {
    ctx.save();
    if (typeof alpha === 'number') ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth || 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLine(ctx, a, b, stroke, lineWidth, dashed, alpha) {
    ctx.save();
    if (typeof alpha === 'number') ctx.globalAlpha = alpha;
    ctx.strokeStyle = stroke || '#ffffff';
    ctx.lineWidth = lineWidth || 1;
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (dashed) ctx.setLineDash([]);
    ctx.restore();
  }

  function drawText(ctx, text, x, y, color, font, align) {
    ctx.save();
    ctx.fillStyle = color || '#ffffff';
    ctx.font = font || '12px sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawTextBox(ctx, text, x, y, options) {
    const cfg = options || {};
    const font = cfg.font || '12px sans-serif';
    ctx.save();
    ctx.font = font;
    const padding = cfg.padding || 6;
    const metrics = ctx.measureText(text);
    const width = metrics.width + padding * 2;
    const height = (cfg.height || 18);
    const rx = x - width / 2;
    const ry = y - height / 2;

    ctx.fillStyle = cfg.background || 'rgba(0,0,0,0.6)';
    ctx.strokeStyle = cfg.border || 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 6, ry);
    ctx.lineTo(rx + width - 6, ry);
    ctx.quadraticCurveTo(rx + width, ry, rx + width, ry + 6);
    ctx.lineTo(rx + width, ry + height - 6);
    ctx.quadraticCurveTo(rx + width, ry + height, rx + width - 6, ry + height);
    ctx.lineTo(rx + 6, ry + height);
    ctx.quadraticCurveTo(rx, ry + height, rx, ry + height - 6);
    ctx.lineTo(rx, ry + 6);
    ctx.quadraticCurveTo(rx, ry, rx + 6, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cfg.color || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawArrow(ctx, from, to, color, width) {
    const headLen = 10;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.strokeStyle = color || '#ffffff';
    ctx.lineWidth = width || 2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color || '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  function drawRing(ctx, center, radius, progress, color, background) {
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = background || 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    if (progress > 0) {
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBar(ctx, x, y, width, height, value, color, background) {
    ctx.save();
    ctx.fillStyle = background || 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color || '#ffffff';
    ctx.fillRect(x, y, width * clamp01(value), height);
    ctx.restore();
  }

  function drawDashedPolyline(ctx, points, color, width, alpha) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color || '#ffffff';
    ctx.lineWidth = width || 1;
    if (typeof alpha === 'number') ctx.globalAlpha = alpha;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  class DebugLayer {
    constructor(name, renderFunction, options) {
      const opts = options || {};
      this.name = name;
      this.label = opts.label || name;
      this.enabled = !!opts.enabled;
      this.opacity = typeof opts.opacity === 'number' ? opts.opacity : 1.0;
      this.shortcut = opts.shortcut || '';
      this.renderFunction = renderFunction;
    }

    toggle() {
      this.enabled = !this.enabled;
    }

    render(ctx, engineStates) {
      if (!this.enabled || typeof this.renderFunction !== 'function') return;
      ctx.save();
      ctx.globalAlpha = this.opacity;
      this.renderFunction(ctx, engineStates);
      ctx.restore();
    }
  }

  class DebugLayerManager {
    constructor() {
      this.layers = [];
      this.layerMap = new Map();
      this.enabled = true;
      this.presets = new Map();
      this.onChange = null;
    }

    addLayer(name, renderFunction, options) {
      const layer = new DebugLayer(name, renderFunction, options);
      this.layers.push(layer);
      this.layerMap.set(name, layer);
      this._notify();
      return layer;
    }

    getLayers() {
      return this.layers.slice();
    }

    toggleLayer(name) {
      const layer = this.layerMap.get(name);
      if (layer) {
        layer.toggle();
        this._notify();
      }
    }

    setLayerEnabled(name, enabled) {
      const layer = this.layerMap.get(name);
      if (layer) {
        layer.enabled = !!enabled;
        this._notify();
      }
    }

    setLayerOpacity(name, opacity) {
      const layer = this.layerMap.get(name);
      if (layer) {
        layer.opacity = clamp01(opacity);
        this._notify();
      }
    }

    renderAll(ctx, engineStates) {
      if (!this.enabled) return;
      for (const layer of this.layers) {
        layer.render(ctx, engineStates);
      }
    }

    showAll() {
      this.layers.forEach(layer => { layer.enabled = true; });
      this._notify();
    }

    hideAll() {
      this.layers.forEach(layer => { layer.enabled = false; });
      this._notify();
    }

    toggleAll() {
      const anyEnabled = this.layers.some(layer => layer.enabled);
      this.layers.forEach(layer => { layer.enabled = !anyEnabled; });
      this._notify();
    }

    addPreset(name, enabledLayers) {
      this.presets.set(name, enabledLayers || []);
    }

    applyPreset(name) {
      const list = this.presets.get(name);
      if (!list) return;
      this.layers.forEach(layer => {
        layer.enabled = list.includes(layer.name);
      });
      this._notify();
    }

    _notify() {
      if (typeof this.onChange === 'function') {
        this.onChange();
      }
    }
  }

  window.DebugLayerManager = DebugLayerManager;
  window.DebugLayer = DebugLayer;
  window.DebugDraw = {
    clamp01,
    drawCircle,
    drawLine,
    drawText,
    drawTextBox,
    drawArrow,
    drawRing,
    drawBar,
    drawDashedPolyline
  };
})();
