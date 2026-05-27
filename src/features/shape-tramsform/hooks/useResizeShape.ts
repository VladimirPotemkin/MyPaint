import { useRef } from 'react';
import { editorStoreApi, useEditorStore } from '@/entities/document/model/store';
import type { Shape } from '@/entities/document/model/types';
import type { Vec2 } from '@/shared/lib/point';
import { screenToWorld } from '@/shared/lib/viewport';
import { MIN_SHAPE_SIZE } from '@/shared/config/constants';
import { applyCommand } from '@/entities/document/model/commands';
import { ResizeShapeCommand } from '@/entities/document/model/commands/ResizeShapeCommand';

type Sizes = Pick<Shape, 'x' | 'y' | 'width' | 'height'>;

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function useResizeShape() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const viewport = useEditorStore((s) => s.viewport);
  const setInteraction = useEditorStore((s) => s.setInteraction);

  const handleRef = useRef<Handle | null>(null);
  const shapeIdRef = useRef<string | null>(null);
  const startPoint = useRef<Vec2 | null>(null);
  const originalRef = useRef<Sizes | null>(null);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool !== 'select') return;

    const target = e.target as HTMLElement;
    const handle = target.closest<HTMLElement>('[data-handle]')?.dataset.handle as
      | Handle
      | undefined;
    const shapeId = target.closest<HTMLElement>('[data-shape-id]')?.dataset.shapeId;

    if (!handle || !shapeId) return;

    const shape = editorStoreApi.getState().document.shapes[shapeId];
    if (!shape || shape.locked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    startPoint.current = screenToWorld(viewport, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    handleRef.current = handle;
    shapeIdRef.current = shapeId;
    originalRef.current = {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!handleRef.current || !shapeIdRef.current || !originalRef.current) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    const { x, y, width, height } = originalRef.current;
    const handle = handleRef.current;

    const fixed = {
      x: handle.includes('w') ? x + width : x,
      y: handle.includes('n') ? y + height : y,
    };

    const newCorner = current;

    const nextX = Math.min(fixed.x, newCorner.x);
    const nextY = Math.min(fixed.y, newCorner.y);
    const nextWidth = Math.max(Math.abs(newCorner.x - fixed.x), MIN_SHAPE_SIZE);
    const nextHeight = Math.max(Math.abs(newCorner.y - fixed.y), MIN_SHAPE_SIZE);

    const isVerticalOnly = handle === 'n' || handle === 's';
    const isHorizontalOnly = handle === 'e' || handle === 'w';

    const resized: Sizes = {
      x: isVerticalOnly ? x : nextX,
      y: isHorizontalOnly ? y : nextY,
      width: isVerticalOnly ? width : nextWidth,
      height: isHorizontalOnly ? height : nextHeight,
    };

    const shape = editorStoreApi.getState().document.shapes[shapeIdRef.current];
    if (!shape) return;

    setInteraction({
      mode: 'resize',
      shapesSnapshot: {
        [shape.id]: {
          ...shape,
          ...resized,
        },
      },
    });
  };

  const onPointerUp = () => {
    if (!handleRef.current || !shapeIdRef.current || !originalRef.current) {
      return;
    }

    const id = shapeIdRef.current;
    const original = originalRef.current;
    const interaction = editorStoreApi.getState().interaction;
    const preview = interaction?.mode === 'resize' ? interaction.shapesSnapshot[id] : null;

    handleRef.current = null;
    shapeIdRef.current = null;
    startPoint.current = null;
    originalRef.current = null;
    setInteraction(null);

    if (!preview) return;

    const next: Sizes = {
      x: preview.x,
      y: preview.y,
      width: preview.width,
      height: preview.height,
    };

    if (
      next.x === original.x &&
      next.y === original.y &&
      next.width === original.width &&
      next.height === original.height
    ) {
      return;
    }

    applyCommand(new ResizeShapeCommand(id, original, next), editorStoreApi);
  };

  return { onPointerDown, onPointerMove, onPointerUp } as const;
}
