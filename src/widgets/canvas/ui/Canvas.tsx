import { useEditorStore } from '@/entities/document/model/store';
import type { Shape } from '@/entities/document/model/types';
import { ShapeView } from '@/entities/shape/ui/ShapeView';
import type { Bbox } from '@/shared/lib/bbox';
import { SelectionOverlay } from '@/widgets/selectionOverlay/ui/SelectionOverlay';
import { useCreateShape } from '@/features/shape-create/ui/useCreateShape';
import { useRef } from 'react';
import { useKeyboard } from '@/features/selection/hooks/useKeyboard';
import { useDragShapes } from '@/features/shape-tramsform/hooks/useDragShapes';
import { useResizeShape } from '@/features/shape-tramsform/hooks/useResizeShape';
import { useRotateShape } from '@/features/shape-tramsform/hooks/useRotateShape';
import { useViewport } from '@/features/viewport/hooks/useViewport';
import { useMarqueeSelect } from '@/features/selection/hooks/useMarqueeSelect';

function getBbox(shape: Shape): Bbox {
  return {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
  };
}

export function Canvas() {
  const editorDoc = useEditorStore((s) => s.document);
  const viewport = useEditorStore((s) => s.viewport);
  const grid = useEditorStore((s) => s.grid);
  const activeTool = useEditorStore((s) => s.activeTool);
  const setSelection = useEditorStore((s) => s.setSelection);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const toggleSelection = useEditorStore((s) => s.toggleSelection);
  const selection = useEditorStore((s) => s.selection);
  const interaction = useEditorStore((s) => s.interaction);
  const svgRef = useRef<SVGSVGElement>(null);

  useKeyboard();

  const { onPointerDown: onCreateDown, onPointerMove: onCreateMove, onPointerUp: onCreateUp } = useCreateShape();
  const { onPointerDown: onDragDown, onPointerMove: onDragMove, onPointerUp: onDragUp } = useDragShapes();
  const { onPointerDown: onResizeDown, onPointerMove: onResizeMove, onPointerUp: onResizeUp } = useResizeShape();
  const { onPointerDown: onRotateDown, onPointerMove: onRotateMove, onPointerUp: onRotateUp } = useRotateShape();
  const { onPointerDown: onMarqueeDown, onPointerMove: onMarqueeMove, onPointerUp: onMarqueeUp, consumeMarqueeClick } = useMarqueeSelect();
  const { onPointerDown: onViewportDown, onPointerMove: onViewportMove, onPointerUp: onViewportUp, isPanningNow } = useViewport(svgRef);

  const previewShape = interaction?.mode === 'create' ? interaction.shapesSnapshot['preview'] : null;

  const isLiveInteraction = interaction?.mode === 'drag' || interaction?.mode === 'resize' || interaction?.mode === 'rotate';
  const shapesToRender = isLiveInteraction
    ? { ...editorDoc.shapes, ...interaction.shapesSnapshot }
    : editorDoc.shapes;

  const transform = `translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      onPointerDown={(e) => {
        onViewportDown(e);
        if (isPanningNow()) return;
        onDragDown(e);
        onResizeDown(e);
        onRotateDown(e);
        onCreateDown(e);
        onMarqueeDown(e);
      }}
      onPointerMove={(e) => {
        onViewportMove(e);
        onDragMove(e);
        onResizeMove(e);
        onRotateMove(e);
        onCreateMove(e);
        onMarqueeMove(e);
      }}
      onPointerUp={(e) => {
        onViewportUp(e);
        onDragUp(e);
        onResizeUp();
        onRotateUp();
        onCreateUp(e);
        onMarqueeUp();
      }}
      onClick={(e) => {
        if (activeTool !== 'select') return;
        if (consumeMarqueeClick()) return;
        const shapeId = (e.target as Element).closest<HTMLElement>('[data-shape-id]')?.dataset.shapeId;
        if (!shapeId) {
          clearSelection();
        } else if (e.shiftKey) {
          toggleSelection(shapeId);
        } else {
          setSelection([shapeId]);
        }
      }}
    >
      <defs>
        <pattern
          id="canvas-grid-pattern"
          x={0}
          y={0}
          width={grid.size}
          height={grid.size}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${grid.size} 0 L 0 0 0 ${grid.size}`}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={1 / viewport.zoom}
            opacity={0.6}
          />
        </pattern>
      </defs>
      <g transform={transform}>
        {grid.enabled && grid.snapToGrid && (
          <rect
            x={-99999}
            y={-99999}
            width={199998}
            height={199998}
            fill="url(#canvas-grid-pattern)"
            pointerEvents="none"
          />
        )}
        {editorDoc.rootChildIds.map((id) => {
          const shape = shapesToRender[id];
          return <ShapeView key={id} shape={shape} />;
        })}
        {previewShape && <ShapeView shape={previewShape} />}

        {interaction?.mode === 'marquee' && interaction.marqueeRect && (
          <rect
            x={interaction.marqueeRect.x}
            y={interaction.marqueeRect.y}
            width={interaction.marqueeRect.width}
            height={interaction.marqueeRect.height}
            fill="rgba(66, 133, 244, 0.1)"
            stroke="rgba(66, 133, 244, 0.8)"
            strokeWidth={1 / viewport.zoom}
            pointerEvents="none"
          />
        )}
        {interaction?.snapGuides?.guideX !== undefined && (
          <line
            x1={interaction.snapGuides.guideX}
            y1={-99999}
            x2={interaction.snapGuides.guideX}
            y2={99999}
            stroke="var(--color-accent)"
            strokeWidth={1 / viewport.zoom}
            strokeDasharray={`${4 / viewport.zoom}`}
            pointerEvents="none"
          />
        )}
        {interaction?.snapGuides?.guideY !== undefined && (
          <line
            x1={-99999}
            y1={interaction.snapGuides.guideY}
            x2={99999}
            y2={interaction.snapGuides.guideY}
            stroke="var(--color-accent)"
            strokeWidth={1 / viewport.zoom}
            strokeDasharray={`${4 / viewport.zoom}`}
            pointerEvents="none"
          />
        )}

        {selection.length > 0 && (
          <SelectionOverlay
            items={selection.map((id) => ({
              id,
              bbox: getBbox(shapesToRender[id]),
              rotation: shapesToRender[id].rotation,
            }))}
          />
        )}
      </g>
    </svg>
  );
}
