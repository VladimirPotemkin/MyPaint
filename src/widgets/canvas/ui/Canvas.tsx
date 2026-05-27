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
import { useViewport } from '@/features/viewport/hooks/useViewport';

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
  const activeTool = useEditorStore((s) => s.activeTool);
  const setSelection = useEditorStore((s) => s.setSelection);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const toggleSelection = useEditorStore((s) => s.toggleSelection);
  const selection = useEditorStore((s) => s.selection);
  const svgRef = useRef<SVGSVGElement>(null);
  useKeyboard();
  const { onPointerDown, onPointerMove, onPointerUp } = useCreateShape();
  const interaction = useEditorStore((s) => s.interaction);
  const previewShape =
    interaction?.mode === 'create' ? interaction.shapesSnapshot['preview'] : null;

  const transform = `translate(${viewport.panX}, ${viewport.panY}) scale(${viewport.zoom})`;
  const {
    onPointerDown: onDragDown,
    onPointerMove: onDragMove,
    onPointerUp: onDragUp,
  } = useDragShapes();
  const {
    onPointerDown: onResizeDown,
    onPointerMove: onResizeMove,
    onPointerUp: onResizeUp,
  } = useResizeShape();
  const {
    onPointerDown: onViewportDown,
    onPointerMove: onViewportMove,
    onPointerUp: onViewportUp,
    isPanningNow,
  } = useViewport(svgRef);

  const shapesToRender =
    interaction && (interaction.mode === 'drag' || interaction.mode === 'resize')
      ? { ...editorDoc.shapes, ...interaction.shapesSnapshot }
      : editorDoc.shapes;

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
        onPointerDown(e);
      }}
      onPointerMove={(e) => {
        onViewportMove(e);
        onDragMove(e);
        onResizeMove(e);
        onPointerMove(e);
      }}
      onPointerUp={(e) => {
        onViewportUp(e);
        onDragUp(e);
        onResizeUp();
        onPointerUp(e);
      }}
      onClick={(e) => {
        if (activeTool !== 'select') return;
        const shapeId = (e.target as Element).closest<HTMLElement>('[data-shape-id]')?.dataset
          .shapeId;
        if (!shapeId) {
          clearSelection();
        } else if (e.shiftKey) {
          toggleSelection(shapeId);
        } else {
          setSelection([shapeId]);
        }
      }}
    >
      <g transform={transform}>
        {editorDoc.rootChildIds.map((id) => {
          const shape = shapesToRender[id];
          return <ShapeView key={id} shape={shape} />;
        })}
        {previewShape && <ShapeView shape={previewShape} />}
        {selection.length > 0 && (
          <SelectionOverlay
            items={selection.map((id) => ({ id, bbox: getBbox(shapesToRender[id]) }))}
          />
        )}
      </g>
    </svg>
  );
}
