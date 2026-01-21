(function() {
  'use strict';

  class DebugUI {
    constructor(manager, options) {
      this.manager = manager;
      this.panel = document.getElementById((options && options.panelId) || 'debug-layer-panel');
      this.list = document.getElementById((options && options.listId) || 'debug-layer-list');
      this.hideBtn = document.getElementById('debug-ui-hide');
      this.showAllBtn = document.getElementById('debug-show-all');
      this.hideAllBtn = document.getElementById('debug-hide-all');
      this.toggleAllBtn = document.getElementById('debug-toggle-all');
      this.presetButtons = {
        minimal: document.getElementById('debug-preset-minimal'),
        debug: document.getElementById('debug-preset-debug'),
        demo: document.getElementById('debug-preset-demo'),
        full: document.getElementById('debug-preset-full')
      };

      this._bind();
      this.refresh();
      this.manager.onChange = () => this.refresh();
    }

    _bind() {
      if (this.hideBtn) {
        this.hideBtn.addEventListener('click', () => this.togglePanel());
      }
      if (this.showAllBtn) {
        this.showAllBtn.addEventListener('click', () => this.manager.showAll());
      }
      if (this.hideAllBtn) {
        this.hideAllBtn.addEventListener('click', () => this.manager.hideAll());
      }
      if (this.toggleAllBtn) {
        this.toggleAllBtn.addEventListener('click', () => this.manager.toggleAll());
      }

      if (this.presetButtons.minimal) {
        this.presetButtons.minimal.addEventListener('click', () => this.manager.applyPreset('Minimal'));
      }
      if (this.presetButtons.debug) {
        this.presetButtons.debug.addEventListener('click', () => this.manager.applyPreset('Debugging'));
      }
      if (this.presetButtons.demo) {
        this.presetButtons.demo.addEventListener('click', () => this.manager.applyPreset('Demo Mode'));
      }
      if (this.presetButtons.full) {
        this.presetButtons.full.addEventListener('click', () => this.manager.applyPreset('Full Diagnostic'));
      }

      document.addEventListener('keydown', (e) => {
        if (e.key === 'h' || e.key === 'H') {
          this.togglePanel();
        }
        if (e.key === ' ') {
          e.preventDefault();
          this.manager.toggleAll();
        }
        const idx = parseInt(e.key, 10);
        if (!Number.isNaN(idx)) {
          const layers = this.manager.getLayers();
          const layer = layers[idx - 1];
          if (layer) this.manager.toggleLayer(layer.name);
        }
      });
    }

    togglePanel() {
      if (!this.panel) return;
      this.panel.classList.toggle('hidden');
    }

    showPanel() {
      if (!this.panel) return;
      this.panel.classList.remove('hidden');
    }

    refresh() {
      if (!this.list) return;
      this.list.innerHTML = '';
      const layers = this.manager.getLayers();
      layers.forEach((layer, idx) => {
        const row = document.createElement('div');
        row.className = 'debug-layer-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = layer.enabled;
        checkbox.addEventListener('change', () => this.manager.setLayerEnabled(layer.name, checkbox.checked));

        const title = document.createElement('div');
        title.className = 'debug-layer-title';
        title.textContent = layer.label;

        const shortcut = document.createElement('div');
        shortcut.className = 'debug-layer-shortcut';
        shortcut.textContent = layer.shortcut || `${idx + 1}`;

        row.appendChild(checkbox);
        row.appendChild(title);
        row.appendChild(shortcut);
        this.list.appendChild(row);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0.2';
        slider.max = '1';
        slider.step = '0.05';
        slider.value = layer.opacity;
        slider.className = 'debug-layer-slider';
        slider.addEventListener('input', () => this.manager.setLayerOpacity(layer.name, parseFloat(slider.value)));
        this.list.appendChild(slider);
      });
    }
  }

  window.DebugUI = DebugUI;
})();
