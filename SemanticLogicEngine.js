(() => {
  'use strict';

  const TIP_INDICES = [4, 8, 12, 16, 20];
  const FINGER_COLORS = ['#f59e0b', '#60a5fa', '#34d399', '#f472b6', '#a78bfa'];

  function avgPoint(points, indices) {
    const sum = indices.reduce((acc, idx) => {
      acc.x += points[idx].x;
      acc.y += points[idx].y;
      return acc;
    }, { x: 0, y: 0 });
    return { x: sum.x / indices.length, y: sum.y / indices.length };
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  class SemanticLogicEngine {
    update(rawLm, toPx, exerciseDef, canvasW, canvasH) {
      const pointsPx = rawLm.map(toPx);
      const palmCenter = avgPoint(pointsPx, [0, 5, 9, 13, 17]);
      const palmWidth = dist(pointsPx[5], pointsPx[17]);

      let targetFingers = [0, 1, 2, 3, 4];
      if (exerciseDef) {
        if (exerciseDef.type === 'isolation' && Array.isArray(exerciseDef.targetFingers)) {
          targetFingers = exerciseDef.targetFingers;
        } else if (exerciseDef.type === 'pinch' && Array.isArray(exerciseDef.pinchPair)) {
          targetFingers = exerciseDef.pinchPair.map(idx => TIP_INDICES.indexOf(idx)).filter(v => v >= 0);
        }
      }

      const tips = TIP_INDICES.map((idx, i) => ({
        index: i,
        point: pointsPx[idx],
        color: FINGER_COLORS[i],
        isTarget: targetFingers.includes(i)
      }));

      const projections = tips.map(tip => ({
        from: palmCenter,
        to: tip.point,
        color: tip.color,
        isTarget: tip.isTarget
      }));

      const gridSize = 24;
      const primaryDenialY = palmCenter.y - palmWidth * 0.9;
      const secondaryDenialY = primaryDenialY + palmWidth * 0.2;

      const countedSquares = tips.map(tip => {
        const gx = Math.floor(tip.point.x / gridSize) * gridSize;
        const gy = Math.floor(tip.point.y / gridSize) * gridSize;
        const aboveDenial = tip.point.y < secondaryDenialY;
        return {
          x: gx,
          y: gy,
          size: gridSize,
          color: tip.isTarget ? tip.color : 'rgba(255,255,255,0.2)',
          isTarget: tip.isTarget,
          active: tip.isTarget && aboveDenial
        };
      });

      return {
        palmCenter,
        projections,
        tips,
        grid: { size: gridSize, width: canvasW, height: canvasH },
        denialLines: {
          primaryY: primaryDenialY,
          secondaryY: secondaryDenialY
        },
        countedSquares
      };
    }
  }

  window.SemanticLogicEngine = SemanticLogicEngine;
})();
