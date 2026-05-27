import { describe, it, expect } from 'vitest';
import { screenToWorld, worldToScreen } from './viewport';
import type { ViewportState } from '@/entities/document/model/types';

describe('viewport coordinate conversion', () => {
  const viewport: ViewportState = { panX: 100, panY: 50, zoom: 2 };

  it('round-trip: worldToScreen → screenToWorld возвращает исходную точку', () => {
    const world = { x: 300, y: 200 };
    const screen = worldToScreen(viewport, world);
    const worldBack = screenToWorld(viewport, screen);
    expect(worldBack.x).toBeCloseTo(world.x);
    expect(worldBack.y).toBeCloseTo(world.y);
  });

  it('zoom=2, pan=0: экранная (200,100) → мировая (100,50)', () => {
    const viewPortNoPan: ViewportState = { panX: 0, panY: 0, zoom: 2 };
    const screen = { x: 200, y: 100 };
    const world = screenToWorld(viewPortNoPan, screen);
    expect(world.x).toBeCloseTo(100);
    expect(world.y).toBeCloseTo(50);
  });
});
