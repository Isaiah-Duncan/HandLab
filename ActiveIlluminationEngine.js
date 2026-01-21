(() => {
  'use strict';

  class ActiveIlluminationEngine {
    constructor() {
      this.lowCanvas = document.createElement('canvas');
      this.lowCtx = this.lowCanvas.getContext('2d', { willReadFrequently: true });
      this.rCanvas = document.createElement('canvas');
      this.gCanvas = document.createElement('canvas');
      this.bCanvas = document.createElement('canvas');
      this.nCanvas = document.createElement('canvas');
      this.rCtx = this.rCanvas.getContext('2d');
      this.gCtx = this.gCanvas.getContext('2d');
      this.bCtx = this.bCanvas.getContext('2d');
      this.nCtx = this.nCanvas.getContext('2d');
    }

    update(image, canvasW, canvasH) {
      if (!image) return null;

      const w = 120;
      const h = 90;
      if (this.lowCanvas.width !== w || this.lowCanvas.height !== h) {
        this.lowCanvas.width = w;
        this.lowCanvas.height = h;
        this.rCanvas.width = w;
        this.rCanvas.height = h;
        this.gCanvas.width = w;
        this.gCanvas.height = h;
        this.bCanvas.width = w;
        this.bCanvas.height = h;
        this.nCanvas.width = w;
        this.nCanvas.height = h;
      }

      this.lowCtx.drawImage(image, 0, 0, w, h);
      const data = this.lowCtx.getImageData(0, 0, w, h);
      const rData = this.rCtx.createImageData(w, h);
      const gData = this.gCtx.createImageData(w, h);
      const bData = this.bCtx.createImageData(w, h);
      const nData = this.nCtx.createImageData(w, h);

      for (let i = 0; i < data.data.length; i += 4) {
        const r = data.data[i];
        const g = data.data[i + 1];
        const b = data.data[i + 2];
        const a = data.data[i + 3];

        rData.data[i] = r;
        rData.data[i + 1] = 0;
        rData.data[i + 2] = 0;
        rData.data[i + 3] = a;

        gData.data[i] = 0;
        gData.data[i + 1] = g;
        gData.data[i + 2] = 0;
        gData.data[i + 3] = a;

        bData.data[i] = 0;
        bData.data[i + 1] = 0;
        bData.data[i + 2] = b;
        bData.data[i + 3] = a;

        const rn = r / 255;
        const gn = g / 255;
        const bn = b / 255;
        let nx = rn - gn;
        let ny = gn - bn;
        let nz = 1;
        const mag = Math.hypot(nx, ny, nz) || 1;
        nx /= mag;
        ny /= mag;
        nz /= mag;

        nData.data[i] = Math.round((nx * 0.5 + 0.5) * 255);
        nData.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        nData.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        nData.data[i + 3] = 255;
      }

      this.rCtx.putImageData(rData, 0, 0);
      this.gCtx.putImageData(gData, 0, 0);
      this.bCtx.putImageData(bData, 0, 0);
      this.nCtx.putImageData(nData, 0, 0);

      return {
        canvasSize: { width: canvasW, height: canvasH },
        previewSize: { width: w, height: h },
        previews: {
          r: this.rCanvas,
          g: this.gCanvas,
          b: this.bCanvas,
          n: this.nCanvas
        }
      };
    }
  }

  window.ActiveIlluminationEngine = ActiveIlluminationEngine;
})();
