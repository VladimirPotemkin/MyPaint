import type { Shape } from '@/entities/document/model/types';

type Props = { shape: Shape };

export function ShapeView({ shape }: Readonly<Props>) {
  if (!shape.visible) return null;

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
        />
      );
    case 'ellipse':
      return (
        <ellipse
          data-shape-id={shape.id}
          cx={shape.x + shape.width / 2}
          cy={shape.y + shape.height / 2}
          rx={shape.width / 2}
          ry={shape.height / 2}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          opacity={shape.opacity}
        />
      );
    case 'group':
      return null;
  }
}
