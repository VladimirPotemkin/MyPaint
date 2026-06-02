import { useRef } from 'react';
import { editorStoreApi, useEditorStore } from '@/entities/document/model/store';
import type { Shape } from '@/entities/document/model/types';
import type { Vec2 } from '@/shared/lib/point';
import { rotatePoint } from '@/shared/lib/point';
import { screenToWorld } from '@/shared/lib/viewport';
import { MIN_SHAPE_SIZE } from '@/shared/config/constants';
import { applyCommand } from '@/entities/document/model/commands';
import { ResizeShapeCommand } from '@/entities/document/model/commands/ResizeShapeCommand';
import { snapToGrid } from '@/shared/lib/snap';

type Sizes = Pick<Shape, 'x' | 'y' | 'width' | 'height'>;
type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function useResizeShape() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const viewport = useEditorStore((s) => s.viewport);
  const setInteraction = useEditorStore((s) => s.setInteraction);

  const handleRef = useRef<Handle | null>(null);
  const shapeIdRef = useRef<string | null>(null);
  const originalRef = useRef<Sizes | null>(null);
  // Original world center and local fixed point — needed for rotation-aware resize
  const centerRef = useRef<Vec2>({ x: 0, y: 0 });
  const fixedLocalRef = useRef<Vec2>({ x: 0, y: 0 });
  const rotationRef = useRef<number>(0);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool !== 'select') return;

    const target = e.target as HTMLElement;
    const rawHandle = target.closest<HTMLElement>('[data-handle]')?.dataset.handle;
    const shapeId = target.closest<HTMLElement>('[data-shape-id]')?.dataset.shapeId;

    if (!rawHandle || !shapeId || rawHandle === 'rotate') return;
    const handle = rawHandle as Handle;

    const shape = editorStoreApi.getState().document.shapes[shapeId];
    if (!shape || shape.locked) return;

    const { x, y, width, height, rotation } = shape;

    originalRef.current = { x, y, width, height };
    handleRef.current = handle;
    shapeIdRef.current = shapeId;
    rotationRef.current = rotation;
    centerRef.current = { x: x + width / 2, y: y + height / 2 };
    // Fixed point (opposite corner) in LOCAL (pre-rotation) space
    fixedLocalRef.current = {
      x: handle.includes('w') ? x + width : x,
      y: handle.includes('n') ? y + height : y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!handleRef.current || !shapeIdRef.current || !originalRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const cursorWorld = screenToWorld(viewport, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    const { x, y, width, height } = originalRef.current;
    const handle = handleRef.current;
    const W0 = centerRef.current;
    const F_L = fixedLocalRef.current;
    const rotation = rotationRef.current;

    // Map cursor into the shape's local (pre-rotation) coordinate system
    let cursorLocal = rotatePoint(cursorWorld, W0, -rotation);
    const { grid } = editorStoreApi.getState();
    if (grid.snapToGrid) {
      cursorLocal = {
        x: snapToGrid(cursorLocal.x, grid.size),
        y: snapToGrid(cursorLocal.y, grid.size),
      };
    }

    const isVerticalOnly = handle === 'n' || handle === 's';
    const isHorizontalOnly = handle === 'e' || handle === 'w';

    const nextX_L = isVerticalOnly ? x : Math.min(F_L.x, cursorLocal.x);
    const nextY_L = isHorizontalOnly ? y : Math.min(F_L.y, cursorLocal.y);
    const nextW = isVerticalOnly ? width : Math.max(Math.abs(cursorLocal.x - F_L.x), MIN_SHAPE_SIZE);
    const nextH = isHorizontalOnly ? height : Math.max(Math.abs(cursorLocal.y - F_L.y), MIN_SHAPE_SIZE);

    // New center in local space → convert back to world
    const W1_local: Vec2 = { x: nextX_L + nextW / 2, y: nextY_L + nextH / 2 };
    const W1_world = rotatePoint(W1_local, W0, rotation);

    const newX = W1_world.x - nextW / 2;
    const newY = W1_world.y - nextH / 2;

    const shape = editorStoreApi.getState().document.shapes[shapeIdRef.current];
    if (!shape) return;

    setInteraction({
      mode: 'resize',
      shapesSnapshot: {
        [shape.id]: { ...shape, x: newX, y: newY, width: nextW, height: nextH },
      },
    });
  };

  const onPointerUp = () => {
    if (!handleRef.current || !shapeIdRef.current || !originalRef.current) return;

    const id = shapeIdRef.current;
    const original = originalRef.current;
    const interaction = editorStoreApi.getState().interaction;
    const preview = interaction?.mode === 'resize' ? interaction.shapesSnapshot[id] : null;

    handleRef.current = null;
    shapeIdRef.current = null;
    originalRef.current = null;
    setInteraction(null);

    if (!preview) return;

    const next: Sizes = { x: preview.x, y: preview.y, width: preview.width, height: preview.height };

    if (next.x === original.x && next.y === original.y && next.width === original.width && next.height === original.height) {
      return;
    }

    applyCommand(new ResizeShapeCommand(id, original, next), editorStoreApi);
  };

  return { onPointerDown, onPointerMove, onPointerUp } as const;
}
