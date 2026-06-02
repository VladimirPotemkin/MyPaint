import type { Bbox } from './bbox';

export type SnapResult = {
  dx: number;
  dy: number;
  guideX?: number;
  guideY?: number;
};

function findAxisSnap(
  movingStart: number,
  movingSize: number,
  candidates: readonly Bbox[],
  threshold: number,
  axis: 'x' | 'y',
): { delta: number; guide?: number } {
  const movingEdges = [movingStart, movingStart + movingSize / 2, movingStart + movingSize];
  let bestDist = threshold;
  let bestDelta = 0;
  let guide: number | undefined;

  for (const candidate of candidates) {
    const candidateStart = candidate[axis];
    const candidateSize = axis === 'x' ? candidate.width : candidate.height;
    const candidateEdges = [
      candidateStart,
      candidateStart + candidateSize / 2,
      candidateStart + candidateSize,
    ];

    for (const movingEdge of movingEdges) {
      for (const candidateEdge of candidateEdges) {
        const delta = candidateEdge - movingEdge;
        const dist = Math.abs(delta);
        if (dist < bestDist) {
          bestDist = dist;
          bestDelta = delta;
          guide = candidateEdge;
        }
      }
    }
  }

  return { delta: bestDelta, guide };
}

export function snapBboxToObjects(
  bbox: Bbox,
  candidates: readonly Bbox[],
  threshold: number,
): SnapResult {
  const xSnap = findAxisSnap(bbox.x, bbox.width, candidates, threshold, 'x');
  const ySnap = findAxisSnap(bbox.y, bbox.height, candidates, threshold, 'y');

  return {
    dx: xSnap.delta,
    dy: ySnap.delta,
    ...(xSnap.guide === undefined ? {} : { guideX: xSnap.guide }),
    ...(ySnap.guide === undefined ? {} : { guideY: ySnap.guide }),
  };
}

export const snapBBoxToCandidates = snapBboxToObjects;

export function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}
