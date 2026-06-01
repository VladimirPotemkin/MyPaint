import { useRef } from 'react';
import { editorStoreApi, useEditorStore } from '@/entities/document/model/store';
import type { Vec2 } from '@/shared/lib/point';
import { screenToWorld } from '@/shared/lib/viewport';

type Rect = { x: number; y: number; width: number; height: number };

function bboxesIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function useMarqueeSelect() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const viewport = useEditorStore((s) => s.viewport);
  const setInteraction = useEditorStore((s) => s.setInteraction);
  const setSelection = useEditorStore((s) => s.setSelection);

  const startPoint = useRef<Vec2 | null>(null);
  const isMarquee = useRef(false);
  const justFinished = useRef(false);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool !== 'select') return;

    const target = e.target as HTMLElement;
    const shapeId = target.closest<HTMLElement>('[data-shape-id]')?.dataset.shapeId;
    const handle = target.closest<HTMLElement>('[data-handle]')?.dataset.handle;
    if (shapeId || handle) return;

    const rect = e.currentTarget.getBoundingClientRect();
    startPoint.current = screenToWorld(viewport, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!startPoint.current) return;

    if (!isMarquee.current) {
      e.currentTarget.setPointerCapture(e.pointerId);
      isMarquee.current = true;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const current = screenToWorld(viewport, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    const start = startPoint.current;
    const marqueeRect = {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };

    setInteraction({ mode: 'marquee', shapesSnapshot: {}, marqueeRect });
  };

  const onPointerUp = () => {
    const wasMarquee = isMarquee.current;

    // Read before clearing
    const { interaction, document: doc } = editorStoreApi.getState();
    const mRect = interaction?.mode === 'marquee' ? interaction.marqueeRect : null;

    startPoint.current = null;
    isMarquee.current = false;
    setInteraction(null);

    if (!wasMarquee || !mRect) return;

    const selected = doc.rootChildIds.filter((id) => {
      const s = doc.shapes[id];
      if (!s?.visible || s.locked) return false;
      return bboxesIntersect(mRect, s);
    });

    justFinished.current = true;
    setSelection(selected);
  };

  const consumeMarqueeClick = () => {
    if (!justFinished.current) return false;
    justFinished.current = false;
    return true;
  };

  return { onPointerDown, onPointerMove, onPointerUp, consumeMarqueeClick } as const;
}
