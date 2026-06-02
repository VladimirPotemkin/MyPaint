import type { Bbox } from "@/shared/lib/bbox";
import { useEditorStore } from "@/entities/document/model/store";
import { anchors } from '@/shared/lib/bbox';
import { HANDLE_SIZE, ROTATE_HANDLE_OFFSET } from '@/shared/config/constants';

type Props = { items: Array<{ id: string; bbox: Bbox; rotation: number }> }

// Base handle angles in degrees (direction of movement, from east = 0)
const HANDLE_BASE_ANGLE: Record<string, number> = {
  n: -90, ne: -45, e: 0, se: 45,
  s: 90, sw: 135, w: 180, nw: -135,
};
// CSS cursors indexed by snapped angle slot (0=0°, 1=45°, 2=90°, 3=135°)
const CURSORS_BY_SLOT = ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'];

function getResizeCursor(handle: string, rotationRad: number): string {
  const base = HANDLE_BASE_ANGLE[handle];
  if (base === undefined) return 'default';
  const rotDeg = rotationRad * (180 / Math.PI);
  // Normalize to [0, 180) — cursors are bidirectional
  const angle = ((base + rotDeg) % 180 + 180) % 180;
  const slot = Math.round(angle / 45) % 4;
  return CURSORS_BY_SLOT[slot];
}

export function SelectionOverlay({ items }: Readonly<Props>) {
  const viewport = useEditorStore((s) => s.viewport);
  const size = HANDLE_SIZE / viewport.zoom;
  const rotateOffset = ROTATE_HANDLE_OFFSET / viewport.zoom;
  const rotateRadius = (HANDLE_SIZE / 2) / viewport.zoom;

  return (
    <g id="selection-overlay">
      {items.map(({ id, bbox, rotation }) => {
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        const rotateDeg = rotation * (180 / Math.PI);
        const groupTransform = rotation === 0 ? undefined : `rotate(${rotateDeg}, ${cx}, ${cy})`;

        return (
          <g key={id} transform={groupTransform}>
            <rect
              x={bbox.x} y={bbox.y} width={bbox.width} height={bbox.height}
              fill="none" stroke="var(--color-handle)"
              strokeWidth={1 / viewport.zoom} pointerEvents="none"
            />

            {Object.entries(anchors(bbox)).map(([handle, point]) => {
              if (handle === 'c') return null;
              return (
                <rect
                  key={handle}
                  data-handle={handle}
                  data-shape-id={id}
                  x={point.x - size / 2}
                  y={point.y - size / 2}
                  width={size}
                  height={size}
                  fill="white"
                  stroke="var(--color-handle)"
                  strokeWidth={1 / viewport.zoom}
                  cursor={getResizeCursor(handle, rotation)}
                  pointerEvents="all"
                />
              );
            })}

            <circle
              data-handle="rotate"
              data-shape-id={id}
              cx={cx}
              cy={bbox.y - rotateOffset}
              r={rotateRadius}
              fill="white"
              stroke="var(--color-handle)"
              strokeWidth={1 / viewport.zoom}
              cursor="grab"
              pointerEvents="all"
            />
            <line
              x1={cx} y1={bbox.y}
              x2={cx} y2={bbox.y - rotateOffset}
              stroke="var(--color-handle)"
              strokeWidth={1 / viewport.zoom}
              pointerEvents="none"
            />
          </g>
        );
      })}
    </g>
  );
}
