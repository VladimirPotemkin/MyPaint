import { useRef } from 'react';
import { editorStoreApi, useEditorStore } from '@/entities/document/model/store';
import type { Shape } from '@/entities/document/model/types';
import type { Vec2 } from '@/shared/lib/point';
import { rotatePoint } from '@/shared/lib/point';
import { screenToWorld } from '@/shared/lib/viewport';
import { union } from '@/shared/lib/bbox';
import { applyCommand } from '@/entities/document/model/commands';
import { RotateShapesCommand } from '@/entities/document/model/commands/RotateShapesCommand';

export function useRotateShape() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const viewport = useEditorStore((s) => s.viewport);
  const setInteraction = useEditorStore((s) => s.setInteraction);

  const isRotating = useRef(false);
  const pivotRef = useRef<Vec2 | null>(null);
  const startAngleRef = useRef<number>(0);
  const originalShapes = useRef<Record<string, Shape>>({});

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool !== 'select') return;

    const target = e.target as HTMLElement;
    const handle = target.closest<HTMLElement>('[data-handle]')?.dataset.handle;
    if (handle !== 'rotate') return;

    const { selection, document: doc } = editorStoreApi.getState();
    const ids = selection.length > 0 ? selection : [];
    if (ids.length === 0) return;

    const shapes = ids
      .map((id) => doc.shapes[id])
      .filter((s): s is Shape => Boolean(s) && !s.locked);
    if (shapes.length === 0) return;

    const bboxes = shapes.map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height }));
    const combined = bboxes.reduce((acc, b) => union(acc, b), bboxes[0]);
    const pivot: Vec2 = { x: combined.x + combined.width / 2, y: combined.y + combined.height / 2 };

    const rect = e.currentTarget.getBoundingClientRect();
    const startWorld = screenToWorld(viewport, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    pivotRef.current = pivot;
    startAngleRef.current = Math.atan2(startWorld.y - pivot.y, startWorld.x - pivot.x);
    originalShapes.current = Object.fromEntries(shapes.map((s) => [s.id, s]));
    isRotating.current = true;

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isRotating.current || !pivotRef.current) return;

    const pivot = pivotRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    const currentAngle = Math.atan2(current.y - pivot.y, current.x - pivot.x);
    const deltaAngle = currentAngle - startAngleRef.current;

    const shapesSnapshot: Record<string, Shape> = {};
    for (const [id, shape] of Object.entries(originalShapes.current)) {
      const shapeCx = shape.x + shape.width / 2;
      const shapeCy = shape.y + shape.height / 2;
      const newCenter = rotatePoint({ x: shapeCx, y: shapeCy }, pivot, deltaAngle);
      shapesSnapshot[id] = {
        ...shape,
        rotation: shape.rotation + deltaAngle,
        x: newCenter.x - shape.width / 2,
        y: newCenter.y - shape.height / 2,
      };
    }

    setInteraction({ mode: 'rotate', shapesSnapshot });
  };

  const onPointerUp = () => {
    if (!isRotating.current || !pivotRef.current) return;

    const interaction = editorStoreApi.getState().interaction;
    const snapshot = interaction?.mode === 'rotate' ? interaction.shapesSnapshot : null;

    isRotating.current = false;
    pivotRef.current = null;
    startAngleRef.current = 0;
    setInteraction(null);

    if (!snapshot) return;

    const entries = Object.entries(originalShapes.current).flatMap(([id, original]) => {
      const next = snapshot[id];
      if (!next) return [];
      return [{
        id,
        fromRotation: original.rotation,
        toRotation: next.rotation,
        fromX: original.x,
        toX: next.x,
        fromY: original.y,
        toY: next.y,
      }];
    });

    if (entries.length > 0) {
      applyCommand(new RotateShapesCommand(entries), editorStoreApi);
    }

    originalShapes.current = {};
  };

  return { onPointerDown, onPointerMove, onPointerUp } as const;
}
