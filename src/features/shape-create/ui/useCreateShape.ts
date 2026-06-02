import { useRef } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { screenToWorld } from '@/shared/lib/viewport';
import { MIN_SHAPE_SIZE } from '@/shared/config/constants';
import { applyCommand } from '@/entities/document/model/commands';
import { AddShapeCommand } from '@/entities/document/model/commands/AddShapeCommand';
import type { Vec2 } from '@/shared/lib/point';
import type { Shape } from '@/entities/document/model/types';
import { snapToGrid } from '@/shared/lib/snap';

// Строим Shape из двух точек — вынесено чтобы не дублировать в move и up
function buildShape(
  type: 'rect' | 'ellipse',
  start: Vec2,
  end: Vec2,
  gridSize: number | null,
): Shape {
  const startX = gridSize === null ? start.x : snapToGrid(start.x, gridSize);
  const startY = gridSize === null ? start.y : snapToGrid(start.y, gridSize);
  const endX = gridSize === null ? end.x : snapToGrid(end.x, gridSize);
  const endY = gridSize === null ? end.y : snapToGrid(end.y, gridSize);
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return {
    id: crypto.randomUUID(),
    name: type === 'rect' ? 'Rectangle' : 'Ellipse',
    type,
    parentId: null,
    x,
    y,
    width,
    height,
    rotation: 0,
    fill: type === 'ellipse' ? '#ff3b30' : '#4f8ef7',
    stroke: 'transparent',
    strokeWidth: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };
}

export function useCreateShape() {
  const startPoint = useRef<Vec2 | null>(null);
  // Сохраняем тип инструмента в момент pointerdown — activeTool может измениться
  // пока пользователь держит кнопку, а ref не вызывает ре-рендер
  const drawingType = useRef<'rect' | 'ellipse' | null>(null);

  const activeTool = useEditorStore((s) => s.activeTool);
  const viewport = useEditorStore((s) => s.viewport);
  const setInteraction = useEditorStore((s) => s.setInteraction);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool !== 'rect' && activeTool !== 'ellipse') return;
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

    // Сбрасываем в любом случае — маленькая фигура тоже считается отменой
    startPoint.current = null;
    drawingType.current = null;
    setInteraction(null);
  };

  return { onPointerDown, onPointerMove, onPointerUp } as const;
}
