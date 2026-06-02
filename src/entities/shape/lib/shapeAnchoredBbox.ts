import type { Vec2 } from '@/shared/lib/point';
import { snapToGrid } from '@/shared/lib/snap';
import type { DrawableTool } from '@/entities/shape/lib/shapeDefaults';

export type Bbox = { x: number; y: number; width: number; height: number };

export type FlippedBbox = Bbox & { flipX: boolean; flipY: boolean };

function snapVec2(p: Vec2, gridSize: number | null): Vec2 {
  if (gridSize === null) return p;
  return { x: snapToGrid(p.x, gridSize), y: snapToGrid(p.y, gridSize) };
}

function buildCornerAnchoredBbox(start: Vec2, end: Vec2): Bbox {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return { x, y, width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) };
}

/** Apex / top spike at start; flip when drag crosses start axes. */
function buildCenterAnchoredFlippedBbox(start: Vec2, end: Vec2): FlippedBbox {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const halfW = Math.abs(dx);
  const height = Math.abs(dy);
  const width = halfW * 2;
  const flipY = dy < 0;
  const flipX = dx < 0;
  return {
    x: start.x - halfW,
    y: flipY ? start.y - height : start.y,
    width,
    height,
    flipX,
    flipY,
  };
}

export function buildCreatePlacement(
  type: DrawableTool,
  start: Vec2,
  end: Vec2,
  gridSize: number | null,
): Bbox | FlippedBbox {
  const s = snapVec2(start, gridSize);
  const e = snapVec2(end, gridSize);
  if (type === 'triangle' || type === 'star') {
    return buildCenterAnchoredFlippedBbox(s, e);
  }
  return buildCornerAnchoredBbox(s, e);
}
