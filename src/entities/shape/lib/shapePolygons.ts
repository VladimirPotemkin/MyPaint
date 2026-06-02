export function getTrianglePoints(width: number, height: number): string {
  return `${width / 2},0 0,${height} ${width},${height}`;
}

export function getStarPoints(width: number, height: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const outerRx = width / 2;
  const outerRy = height / 2;
  const innerRx = outerRx * 0.4;
  const innerRy = outerRy * 0.4;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rx = i % 2 === 0 ? outerRx : innerRx;
    const ry = i % 2 === 0 ? outerRy : innerRy;
    points.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
  }
  return points.join(' ');
}

export function getLocalPolygonTransform(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  flipX = false,
  flipY = false,
): string {
  const cx = width / 2;
  const cy = height / 2;
  let t = `translate(${x}, ${y})`;
  if (flipX || flipY) {
    const sx = flipX ? -1 : 1;
    const sy = flipY ? -1 : 1;
    t += ` translate(${cx}, ${cy}) scale(${sx}, ${sy}) translate(${-cx}, ${-cy})`;
  }
  if (rotation !== 0) {
    const deg = rotation * (180 / Math.PI);
    t += ` rotate(${deg}, ${cx}, ${cy})`;
  }
  return t;
}
