import { useRef } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { screenToWorld } from '@/shared/lib/viewport';
import { MIN_SHAPE_SIZE } from '@/shared/config/constants';
import { applyCommand } from '@/entities/document/model/commands';
import { AddShapeCommand } from '@/entities/document/model/commands/AddShapeCommand';
import type { Vec2 } from '@/shared/lib/point';
import type { Shape } from '@/entities/document/model/types';

// Строим Shape из двух точек — вынесено чтобы не дублировать в move и up
function buildShape(type: 'rect' | 'ellipse', start: Vec2, end: Vec2): Shape {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
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
    fill: '#4f8ef7',
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
    const preview = buildShape(drawingType.current, startPoint.current, current);
    setInteraction({ mode: 'create', shapesSnapshot: { preview } });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!startPoint.current || !drawingType.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    const shape = buildShape(drawingType.current, startPoint.current, current);

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
