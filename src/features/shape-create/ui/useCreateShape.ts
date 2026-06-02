import { useRef } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { screenToWorld } from '@/shared/lib/viewport';
import { MIN_SHAPE_SIZE } from '@/shared/config/constants';
import { applyCommand } from '@/entities/document/model/commands';
import { AddShapeCommand } from '@/entities/document/model/commands/AddShapeCommand';
import type { Vec2 } from '@/shared/lib/point';
import type { Shape } from '@/entities/document/model/types';
import {
  DRAWABLE_SHAPE_DEFAULTS,
  isDrawableTool,
  type DrawableTool,
} from '@/entities/shape/lib/shapeDefaults';
import { buildCreatePlacement, type FlippedBbox } from '@/entities/shape/lib/shapeAnchoredBbox';

function isFlippedPlacement(p: ReturnType<typeof buildCreatePlacement>): p is FlippedBbox {
  return 'flipX' in p;
}

function buildShape(
  type: DrawableTool,
  start: Vec2,
  end: Vec2,
  gridSize: number | null,
): Shape {
  const placement = buildCreatePlacement(type, start, end, gridSize);
  const defaults = DRAWABLE_SHAPE_DEFAULTS[type];
  const base = {
    id: crypto.randomUUID(),
    name: defaults.name,
    parentId: null,
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
    rotation: 0,
    fill: defaults.fill,
    stroke: 'transparent',
    strokeWidth: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };

  if ((type === 'triangle' || type === 'star') && isFlippedPlacement(placement)) {
    return { ...base, type, flipX: placement.flipX, flipY: placement.flipY };
  }
  return { ...base, type };
}

export function useCreateShape() {
  const startPoint = useRef<Vec2 | null>(null);
  const drawingType = useRef<DrawableTool | null>(null);

  const activeTool = useEditorStore((s) => s.activeTool);
  const viewport = useEditorStore((s) => s.viewport);
  const setInteraction = useEditorStore((s) => s.setInteraction);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawableTool(activeTool)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    startPoint.current = current;
    drawingType.current = activeTool;
    setInteraction({ mode: 'create', shapesSnapshot: {} });
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!startPoint.current || !drawingType.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    const { grid } = editorStoreApi.getState();
    const gridSize = grid.snapToGrid ? grid.size : null;
    const preview = buildShape(drawingType.current, startPoint.current, current, gridSize);
    setInteraction({ mode: 'create', shapesSnapshot: { preview } });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!startPoint.current || !drawingType.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    const { grid } = editorStoreApi.getState();
    const gridSize = grid.snapToGrid ? grid.size : null;
    const shape = buildShape(drawingType.current, startPoint.current, current, gridSize);

    if (shape.width >= MIN_SHAPE_SIZE && shape.height >= MIN_SHAPE_SIZE) {
      applyCommand(new AddShapeCommand(shape), editorStoreApi);
    }

    startPoint.current = null;
    drawingType.current = null;
    setInteraction(null);
  };

  return { onPointerDown, onPointerMove, onPointerUp } as const;
}
