import type { Bbox } from "@/shared/lib/bbox";
import { useEditorStore } from "@/entities/document/model/store";
import { anchors } from '@/shared/lib/bbox';
import { HANDLE_SIZE } from '@/shared/config/constants';


type Props = { items: Array<{ id: string; bbox: Bbox }> }
const CURSOR_MAP: Record<string, string> = {
        nw: 'nwse-resize', ne: 'nesw-resize', se: 'nwse-resize', sw: 'nesw-resize',
        n: 'ns-resize', e: 'ew-resize', s: 'ns-resize', w: 'ew-resize',
    };

export function SelectionOverlay({ items }: Readonly<Props>) {
    const viewport = useEditorStore((s) => s.viewport);
    const size = HANDLE_SIZE / viewport.zoom;

    return (
    <g id="selection-overlay">
      {items.map(({ id, bbox }) => (
        <g key={id}>
          <rect x={bbox.x} y={bbox.y} width={bbox.width} height={bbox.height}
            fill="none" stroke="var(--color-handle)"
            strokeWidth={1 / viewport.zoom} pointerEvents="none" />

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
                cursor={CURSOR_MAP[handle]}
                pointerEvents="all"
              />
            );
          })}
        </g>
      ))}
    </g>
  );
}