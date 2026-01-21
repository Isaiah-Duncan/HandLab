const DebugVisionEngine = (function() {
    'use strict';

    const FINGER_NAMES = ['thumb', 'index', 'middle', 'ring', 'pinky'];
    const FINGER_LABELS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
    const FINGER_CHAINS = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
        [17, 18, 19, 20]
    ];
    const TIP_INDICES = [4, 8, 12, 16, 20];
    const PALM_CONNECTIONS = [
        [0, 5],
        [5, 9],
        [9, 13],
        [13, 17],
        [17, 0],
        [0, 9]
    ];

    const COLORS = {
        observed: '#38c88c',
        less: '#f2c94c',
        dead: '#e07a7a',
        frozen: '#9aa0a6',
        palm: 'rgba(70, 120, 140, 0.5)',
        smoothed: 'rgba(90, 140, 175, 0.4)',
        trail: 'rgba(130, 120, 170, 0.35)'
    };

    const state = {
        lastTime: 0,
        lastPoints: null,
        lastSmoothedPoints: null,
        lastFingerRatios: Array(5).fill(null),
        lastBoneLengths: null,
        lastTipOrder: null,
        frozenCounters: Array(5).fill(0),
        tipHistories: Array.from({ length: 5 }, () => []),
        lastPalmCenter: null
    };

    function dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function avgPoint(points, indices) {
        const sum = indices.reduce((acc, idx) => {
            acc.x += points[idx].x;
            acc.y += points[idx].y;
            return acc;
        }, { x: 0, y: 0 });
        return { x: sum.x / indices.length, y: sum.y / indices.length };
    }

    function drawLine(ctx, a, b, color, width, dashed, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.setLineDash(dashed ? [6, 4] : []);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
    }

    function drawCircle(ctx, p, color, radius, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function pushUnique(arr, value) {
        if (!arr.includes(value)) arr.push(value);
    }

    function update(rawLm, smoothedLm, canvas, project, nowMs) {
        if (!rawLm || rawLm.length < 21) return null;

        const points = rawLm.map(project);
        const smoothedPoints = smoothedLm && smoothedLm.length >= 21
            ? smoothedLm.map(project)
            : null;

        const palmWidthPx = dist(points[5], points[17]);
        const handLengthPx = dist(points[0], points[12]);
        const palmCenterPx = avgPoint(points, [0, 5, 9, 13, 17]);
        const dt = state.lastTime ? Math.max(0.001, (nowMs - state.lastTime) / 1000) : 0.016;
        const handMotionPx = state.lastPalmCenter ? dist(palmCenterPx, state.lastPalmCenter) : 0;

        const lowScale = palmWidthPx < 80;
        const sideways = handLengthPx > 0 && (palmWidthPx / handLengthPx) < 0.35;

        const issues = [];
        const blockers = [];
        const perFinger = [];
        const fingerFlags = {
            occluded: Array(5).fill(false),
            foreshortened: Array(5).fill(false),
            jitter: Array(5).fill(false),
            geometry: Array(5).fill(false),
            ambiguity: Array(5).fill(false),
            frozen: Array(5).fill(false),
            collapse: Array(5).fill(false),
            movementPx: Array(5).fill(0)
        };

        if (lowScale) {
            // Low pixel resolution / hand too far from camera
            issues.push({ type: 'low_scale', message: 'Low resolution: hand too small', severity: 'high' });
            pushUnique(blockers, 'Hand too small');
        }
        if (sideways) {
            // Sideways hand regime active
            issues.push({ type: 'sideways', message: 'Sideways hand regime active', severity: 'medium' });
            pushUnique(blockers, 'Sideways regime');
        }

        // Occlusion: fingertips occupy the same 2D region
        const occlusionThreshold = Math.max(12, palmWidthPx * 0.12);
        const tipPoints = TIP_INDICES.map(idx => points[idx]);
        const occlusionPairs = [];
        for (let i = 0; i < tipPoints.length; i++) {
            for (let j = i + 1; j < tipPoints.length; j++) {
                if (dist(tipPoints[i], tipPoints[j]) < occlusionThreshold) {
                    occlusionPairs.push([i, j]);
                    fingerFlags.occluded[i] = true;
                    fingerFlags.occluded[j] = true;
                }
            }
        }
        if (occlusionPairs.length) {
            issues.push({ type: 'occlusion', message: 'Occlusion: fingertips overlapping', severity: 'high' });
            pushUnique(blockers, 'Occlusion');
        }

        // Finger identity ambiguity: tips overlap and ordering swaps
        const lateral = [1, 2, 3, 4].map(f => ({
            finger: f,
            x: points[TIP_INDICES[f]].x,
            y: points[TIP_INDICES[f]].y
        }));
        const order = lateral.slice().sort((a, b) => a.x - b.x).map(v => v.finger).join(',');
        let ambiguousPair = null;
        if (state.lastTipOrder && order !== state.lastTipOrder && occlusionPairs.length) {
            let best = null;
            for (const pair of occlusionPairs) {
                const a = pair[0];
                const b = pair[1];
                if (a === 0 || b === 0) continue;
                const d = dist(points[TIP_INDICES[a]], points[TIP_INDICES[b]]);
                if (!best || d < best.d) best = { a, b, d };
            }
            if (best) {
                ambiguousPair = best;
                fingerFlags.ambiguity[best.a] = true;
                fingerFlags.ambiguity[best.b] = true;
            }
        }
        state.lastTipOrder = order;
        if (ambiguousPair) {
            const pairLabel = `${FINGER_LABELS[ambiguousPair.a]}/${FINGER_LABELS[ambiguousPair.b]}`;
            issues.push({
                type: 'identity',
                message: `Finger identity ambiguous: ${pairLabel}`,
                severity: 'high'
            });
            pushUnique(blockers, 'Finger identity ambiguous');
        }

        // Jitter detection: raw landmarks jump while smoothed are stable
        let avgTipDelta = 0;
        let avgSmoothDelta = 0;
        if (state.lastPoints) {
            for (let i = 0; i < TIP_INDICES.length; i++) {
                const idx = TIP_INDICES[i];
                avgTipDelta += dist(points[idx], state.lastPoints[idx]);
                if (smoothedPoints && state.lastSmoothedPoints) {
                    avgSmoothDelta += dist(smoothedPoints[idx], state.lastSmoothedPoints[idx]);
                }
            }
            avgTipDelta /= TIP_INDICES.length;
            if (smoothedPoints && state.lastSmoothedPoints) {
                avgSmoothDelta /= TIP_INDICES.length;
            }
        }
        const jitterGlobal = state.lastPoints
            && (avgTipDelta / Math.max(1, palmWidthPx)) > 0.18
            && (!smoothedPoints || (avgSmoothDelta / Math.max(1, palmWidthPx)) < 0.08);
        if (jitterGlobal) {
            // Excessive landmark jitter
            issues.push({ type: 'jitter', message: 'Excessive landmark jitter', severity: 'medium' });
        }

        // Bone geometry sanity checks
        const boneLengths = [];
        let geometryIssue = false;
        for (let i = 0; i < FINGER_CHAINS.length; i++) {
            const chain = FINGER_CHAINS[i];
            const bones = [];
            for (let j = 0; j < chain.length - 1; j++) {
                bones.push(dist(points[chain[j]], points[chain[j + 1]]) / Math.max(1, palmWidthPx));
            }
            boneLengths[i] = bones;
            if (state.lastBoneLengths && state.lastBoneLengths[i]) {
                for (let j = 0; j < bones.length; j++) {
                    const prev = state.lastBoneLengths[i][j] || 0;
                    if (prev > 0.01 && Math.abs(bones[j] - prev) / prev > 0.45) {
                        // Impossible bone geometry: bone length changes too fast
                        fingerFlags.geometry[i] = true;
                        geometryIssue = true;
                    }
                }
            }
        }
        if (geometryIssue) {
            issues.push({ type: 'geometry', message: 'Impossible bone geometry detected', severity: 'high' });
            pushUnique(blockers, 'Impossible geometry');
        }

        // Per-finger length, foreshortening, and movement
        for (let i = 0; i < FINGER_CHAINS.length; i++) {
            const chain = FINGER_CHAINS[i];
            let lengthPx = 0;
            for (let j = 0; j < chain.length - 1; j++) {
                lengthPx += dist(points[chain[j]], points[chain[j + 1]]);
            }
            const ratio = lengthPx / Math.max(1, palmWidthPx);
            const prevRatio = state.lastFingerRatios[i];
            if (prevRatio && ratio < prevRatio * 0.6 && prevRatio > 0.2) {
                // Foreshortening: finger length collapses relative to palm scale
                fingerFlags.foreshortened[i] = true;
            }
            state.lastFingerRatios[i] = ratio;
            fingerFlags.collapse[i] = ratio < 0.22;

            if (state.lastPoints) {
                const delta = dist(points[TIP_INDICES[i]], state.lastPoints[TIP_INDICES[i]]);
                fingerFlags.movementPx[i] = delta;
                fingerFlags.jitter[i] = (delta / Math.max(1, palmWidthPx)) > 0.25;
            }
        }

        const foreshortenedIndex = fingerFlags.foreshortened.findIndex(Boolean);
        if (foreshortenedIndex >= 0) {
            issues.push({
                type: 'foreshortening',
                message: `Foreshortening: ${FINGER_LABELS[foreshortenedIndex]} length unreliable`,
                severity: 'medium'
            });
        }

        // Frozen detection: fingertip holds still while palm moves
        if (state.lastPoints) {
            for (let i = 0; i < TIP_INDICES.length; i++) {
                const delta = dist(points[TIP_INDICES[i]], state.lastPoints[TIP_INDICES[i]]);
                if (delta < 1.2 && handMotionPx > 4) {
                    state.frozenCounters[i] += 1;
                } else {
                    state.frozenCounters[i] = Math.max(0, state.frozenCounters[i] - 1);
                }
                if (state.frozenCounters[i] >= 6) {
                    fingerFlags.frozen[i] = true;
                }
            }
        }

        // Per-finger observability state
        for (let i = 0; i < FINGER_CHAINS.length; i++) {
            const less =
                fingerFlags.occluded[i]
                || fingerFlags.foreshortened[i]
                || fingerFlags.jitter[i]
                || fingerFlags.geometry[i]
                || fingerFlags.ambiguity[i]
                || lowScale
                || sideways;
            let stateName = 'observed';
            if (fingerFlags.frozen[i]) {
                stateName = 'frozen';
            } else if (fingerFlags.collapse[i] && (fingerFlags.occluded[i] || lowScale || sideways || fingerFlags.geometry[i])) {
                // Unobservable / hallucinated / dead finger
                stateName = 'dead';
            } else if (less) {
                stateName = 'less';
            }
            perFinger.push({
                name: FINGER_LABELS[i],
                state: stateName
            });
        }

        const observedCount = perFinger.filter(f => f.state === 'observed').length;
        const deadCount = perFinger.filter(f => f.state === 'dead').length;
        const lessCount = perFinger.filter(f => f.state === 'less').length;
        const frozenCount = perFinger.filter(f => f.state === 'frozen').length;
        let globalObservability = 'High';
        if (lowScale || deadCount > 0) {
            globalObservability = 'Low';
        } else if (lessCount > 0 || frozenCount > 0) {
            globalObservability = 'Moderate';
        } else if (observedCount === 0) {
            globalObservability = 'Low';
        }

        // Hallucinated continuation: motion despite low observability
        const hallucinatedFinger = perFinger.findIndex((f, idx) =>
            (f.state === 'less' || f.state === 'dead')
            && fingerFlags.movementPx[idx] > palmWidthPx * 0.12
            && (fingerFlags.occluded[idx] || lowScale || sideways)
        );
        if (hallucinatedFinger >= 0) {
            issues.push({
                type: 'hallucination',
                message: `Hallucinated continuation: ${FINGER_LABELS[hallucinatedFinger]} moving`,
                severity: 'high'
            });
            pushUnique(blockers, 'Hallucinated continuation');
        }

        if (jitterGlobal) {
            pushUnique(blockers, 'Landmark jitter');
        }

        state.lastPoints = points;
        state.lastSmoothedPoints = smoothedPoints;
        state.lastBoneLengths = boneLengths;
        state.lastPalmCenter = palmCenterPx;
        state.lastTime = nowMs;

        for (let i = 0; i < TIP_INDICES.length; i++) {
            const history = state.tipHistories[i];
            history.push({ ...points[TIP_INDICES[i]], t: nowMs });
            while (history.length > 10) history.shift();
        }

        return {
            palmWidthPx,
            handLengthPx,
            palmCenterPx,
            globalObservability,
            regime: sideways ? 'Sideways' : 'Front-facing',
            perFinger,
            issues,
            blockers,
            points,
            smoothedPoints,
            fingerFlags
        };
    }

    function render(ctx, canvas, rawLm, smoothedLm, data, project) {
        if (!data || !rawLm) return;

        const points = data.points || rawLm.map(project);
        const smoothedPoints = data.smoothedPoints;
        const issues = data.issues || [];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (smoothedPoints) {
            for (const conn of PALM_CONNECTIONS) {
                drawLine(ctx, smoothedPoints[conn[0]], smoothedPoints[conn[1]], COLORS.smoothed, 2, false, 0.35);
            }
            for (let i = 0; i < FINGER_CHAINS.length; i++) {
                const chain = FINGER_CHAINS[i];
                for (let j = 0; j < chain.length - 1; j++) {
                    drawLine(ctx, smoothedPoints[chain[j]], smoothedPoints[chain[j + 1]], COLORS.smoothed, 2, false, 0.35);
                }
            }
        }

        for (const conn of PALM_CONNECTIONS) {
            drawLine(ctx, points[conn[0]], points[conn[1]], COLORS.palm, 3, false, 0.55);
        }

        for (let i = 0; i < FINGER_CHAINS.length; i++) {
            const chain = FINGER_CHAINS[i];
            const stateName = data.perFinger[i]?.state || 'observed';
            const color = COLORS[stateName] || COLORS.observed;
            const dashed = stateName === 'less' || stateName === 'dead' || stateName === 'frozen';
            const alpha = stateName === 'observed' ? 0.9 : stateName === 'less' ? 0.6 : 0.45;

            // Faint trail for low observability / jitter / hallucination
            if (stateName !== 'observed') {
                const history = state.tipHistories[i];
                for (let h = 1; h < history.length; h++) {
                    drawLine(ctx, history[h - 1], history[h], COLORS.trail, 2, true, 0.35);
                }
            }

            for (let j = 0; j < chain.length - 1; j++) {
                drawLine(ctx, points[chain[j]], points[chain[j + 1]], color, 4, dashed, alpha);
            }
            for (let j = 0; j < chain.length; j++) {
                drawCircle(ctx, points[chain[j]], color, j === chain.length - 1 ? 6 : 4, alpha);
            }

            if (stateName === 'frozen') {
                const tip = points[TIP_INDICES[i]];
                ctx.save();
                ctx.fillStyle = '#5a5a5a';
                ctx.font = '12px Nunito, system-ui';
                ctx.fillText('Inferred (last known pose)', tip.x + 8, tip.y - 10);
                ctx.restore();
            }
        }

        if (issues.length) {
            const baseX = data.palmCenterPx ? data.palmCenterPx.x + 14 : 12;
            let baseY = data.palmCenterPx ? data.palmCenterPx.y - 40 : 20;
            ctx.save();
            ctx.font = '12px Nunito, system-ui';
            ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
            const maxIssues = Math.min(4, issues.length);
            for (let i = 0; i < maxIssues; i++) {
                const msg = issues[i].message;
                ctx.fillText(`WARN: ${msg}`, baseX, baseY);
                baseY -= 16;
            }
            ctx.restore();
        }
    }

    return {
        update,
        render
    };
})();

if (typeof window !== 'undefined') {
    window.DebugVisionEngine = DebugVisionEngine;
}
