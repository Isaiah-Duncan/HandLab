(function() {
  'use strict';

  class ExerciseInterpreterEngine {
    update(fingerZoneData, thumbCrossing, globalState, palmCenter) {
      const constraints = [
        { label: 'Fingers in zones', ok: !Object.values(fingerZoneData).some(v => v.zone === 'purple'), progress: 1 },
        { label: 'Thumb clear', ok: thumbCrossing.length === 0, progress: thumbCrossing.length === 0 ? 1 : 0.4 },
        { label: 'Observability', ok: globalState !== 'unobservable', progress: globalState === 'observed' ? 1 : globalState === 'less' ? 0.6 : 0.2 }
      ];

      return {
        constraints,
        intent: { label: 'Finger Extension', arrow: { from: palmCenter, to: { x: palmCenter.x, y: palmCenter.y - 60 } } }
      };
    }
  }

  window.ExerciseInterpreterEngine = ExerciseInterpreterEngine;
})();
