import type { Vec2 } from './point';

export type Anchors = {
  nw: Vec2;
  n: Vec2;
  ne: Vec2;
  e: Vec2;
  se: Vec2;
  s: Vec2;
  sw: Vec2;
  w: Vec2;
  c: Vec2;
};

export type Bbox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function fromPoints(points: Vec2[]): Bbox {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function union(b1: Bbox, b2: Bbox): Bbox {
  const x = Math.min(b1.x, b2.x);
  const y = Math.min(b1.y, b2.y);
  const maxX = Math.max(b1.x + b1.width, b2.x + b2.width);
  const maxY = Math.max(b1.y + b1.height, b2.y + b2.height);
  return { x, y, width: maxX - x, height: maxY - y };
}

export function corners(b: Bbox): [Vec2, Vec2, Vec2, Vec2] {
  return [
    { x: b.x, y: b.y },
    { x: b.x + b.width, y: b.y },
    { x: b.x + b.width, y: b.y + b.height },
    { x: b.x, y: b.y + b.height },
  ];
}

export function anchors(b: Bbox): Anchors {
  return {
    nw: { x: b.x, y: b.y },
    n: { x: b.x + b.width / 2, y: b.y },
    ne: { x: b.x + b.width, y: b.y },
    e: { x: b.x + b.width, y: b.y + b.height / 2 },
    se: { x: b.x + b.width, y: b.y + b.height },
    s: { x: b.x + b.width / 2, y: b.y + b.height },
    sw: { x: b.x, y: b.y + b.height },
    w: { x: b.x, y: b.y + b.height / 2 },
    c: { x: b.x + b.width / 2, y: b.y + b.height / 2 },
  };
}
