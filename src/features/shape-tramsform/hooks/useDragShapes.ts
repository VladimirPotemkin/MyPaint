import { editorStoreApi, useEditorStore } from '@/entities/document/model/store';
import type { Shape } from '@/entities/document/model/types';
import type { Vec2 } from '@/shared/lib/point';
import { useRef } from 'react';
import { screenToWorld } from '@/shared/lib/viewport';
import { sub } from '@/shared/lib/point';
import { applyCommand } from '@/entities/document/model/commands';
import { MoveShapesCommand } from '@/entities/document/model/commands/MoveShapesCommand';

export function useDragShapes() {
  const startPoint = useRef<Vec2 | null>(null);
  const isDragging = useRef(false);
  // Снапшот оригинальных позиций в момент pointerdown
  const originalShapes = useRef<Record<string, Shape>>({});

  const activeTool = useEditorStore((s) => s.activeTool);
  const viewport = useEditorStore((s) => s.viewport);
  const setInteraction = useEditorStore((s) => s.setInteraction);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool !== 'select') return;

    const shapeId = (e.target as HTMLElement).closest<HTMLElement>('[data-shape-id]')?.dataset
      .shapeId;
    const handle = (e.target as HTMLElement).closest<HTMLElement>('[data-handle]')?.dataset.handle;

    if (!shapeId || handle) return;

    // НЕ вызываем setPointerCapture здесь — это сломает onClick
    const rect = e.currentTarget.getBoundingClientRect();
    startPoint.current = screenToWorld(viewport, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Сохраняем оригинальные позиции всех выделенных фигур
    const { selection, document: doc } = editorStoreApi.getState();
    const ids = selection.includes(shapeId) ? selection : [shapeId];
    originalShapes.current = Object.fromEntries(
      ids.filter((id) => !doc.shapes[id]?.locked).map((id) => [id, doc.shapes[id]]),
    );
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!startPoint.current) return;

    // Захватываем pointer только при реальном движении
    if (!isDragging.current) {
      e.currentTarget.setPointerCapture(e.pointerId);
      isDragging.current = true;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    const delta = sub(current, startPoint.current);

    const shapesSnapshot = Object.fromEntries(
      Object.entries(originalShapes.current).map(([id, shape]) => [
        id,
        { ...shape, x: shape.x + delta.x, y: shape.y + delta.y },
      ]),
    );
    setInteraction({ mode: 'drag', shapesSnapshot });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const wasDragging = isDragging.current;
    const savedStart = startPoint.current;

    startPoint.current = null;
    isDragging.current = false;

    if (!wasDragging || !savedStart) return; // простой клик — не трогаем историю

    setInteraction(null);

    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    const delta = sub(current, savedStart);

    const moves = Object.entries(originalShapes.current).map(([id, shape]) => ({
      id,
      fromX: shape.x,
      fromY: shape.y,
      toX: shape.x + delta.x,
      toY: shape.y + delta.y,
    }));

    if (moves.length > 0) {
      applyCommand(new MoveShapesCommand(moves), editorStoreApi);
    }

    originalShapes.current = {};
  };

  return { onPointerDown, onPointerMove, onPointerUp } as const;
}
