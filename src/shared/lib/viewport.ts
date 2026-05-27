import { invert, applyToPoint } from './affine';
import type { Vec2 } from './point';
import type { ViewportState } from '@/entities/document/model/types';

export function screenToWorld(viewport: ViewportState, screen: Vec2): Vec2 {
  const { panX, panY, zoom } = viewport;
  const invertedMatrix = invert({ a: zoom, b: 0, c: 0, d: zoom, e: panX, f: panY });
  return applyToPoint(invertedMatrix, screen);
}

export function worldToScreen(viewport: ViewportState, world: Vec2): Vec2 {
  const { panX, panY, zoom } = viewport;
  return applyToPoint({ a: zoom, b: 0, c: 0, d: zoom, e: panX, f: panY }, world);
}
