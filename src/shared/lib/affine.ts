import type { Vec2 } from './point';

export type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number };

export function identity(): Matrix {
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}
export function applyToPoint(m: Matrix, p: Vec2): Vec2 {
  return {
    x: m.a * p.x + m.c * p.y + m.e,
    y: m.b * p.x + m.d * p.y + m.f,
  };
}

export function invert(m: Matrix): Matrix {
  const det = m.a * m.d - m.b * m.c;
  if (det === 0) {
    throw new Error('Matrix is not invertible');
  }
  return {
    a: m.d / det,
    b: -m.b / det,
    c: -m.c / det,
    d: m.a / det,
    e: (m.c * m.f - m.e * m.d) / det,
    f: (m.e * m.b - m.a * m.f) / det,
  };
}

export function compose(m1: Matrix, m2: Matrix): Matrix {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}
