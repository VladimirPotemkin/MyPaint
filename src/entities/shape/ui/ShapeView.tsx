import { memo } from 'react';
import type { Shape } from '@/entities/document/model/types';
import {
  getLocalPolygonTransform,
  getStarPoints,
  getTrianglePoints,
} from '@/entities/shape/lib/shapePolygons';

type Props = { shape: Shape; allShapes?: Record<string, Shape> };

const polygonProps = (shape: Shape) => ({
  fill: shape.fill,
  stroke: shape.stroke,
  strokeWidth: shape.strokeWidth,
  opacity: shape.opacity,
});

export const ShapeView = memo(function ShapeView({ shape, allShapes }: Readonly<Props>) {
  if (!shape.visible) return null;

  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const rotateDeg = shape.rotation * (180 / Math.PI);
  const transform = shape.rotation === 0 ? undefined : `rotate(${rotateDeg}, ${cx}, ${cy})`;

  switch (shape.type) {
    case 'rect':
      return (
        <rect
          data-shape-id={shape.id}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
          transform={transform}
        />
      );
    case 'ellipse':
      return (
        <ellipse
          data-shape-id={shape.id}
          cx={cx}
          cy={cy}
          rx={shape.width / 2}
          ry={shape.height / 2}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
          transform={transform}
        />
      );
    case 'triangle':
      return (
        <polygon
          data-shape-id={shape.id}
          points={getTrianglePoints(shape.width, shape.height)}
          transform={getLocalPolygonTransform(
            shape.x,
            shape.y,
            shape.width,
            shape.height,
            shape.rotation,
            shape.flipX,
            shape.flipY,
          )}
          {...polygonProps(shape)}
        />
      );
    case 'star':
      return (
        <polygon
          data-shape-id={shape.id}
          points={getStarPoints(shape.width, shape.height)}
          transform={getLocalPolygonTransform(
            shape.x,
            shape.y,
            shape.width,
            shape.height,
            shape.rotation,
            shape.flipX,
            shape.flipY,
          )}
          {...polygonProps(shape)}
        />
      );
    case 'group': {
      if (!allShapes) return null;
      return (
        <g
          data-shape-id={shape.id}
          transform={`translate(${shape.x}, ${shape.y})`}
          opacity={shape.opacity}
        >
          {/* transparent hit-area so empty space inside the group is clickable */}
          <rect x={0} y={0} width={shape.width} height={shape.height} fill="transparent" />
          {shape.childIds.map((childId) => {
            const child = allShapes[childId];
            if (!child) return null;
            return <ShapeView key={childId} shape={child} allShapes={allShapes} />;
          })}
        </g>
      );
    }
  }
});
