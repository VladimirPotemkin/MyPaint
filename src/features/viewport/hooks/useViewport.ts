import { useEffect, useRef } from 'react';
import { editorStoreApi, useEditorStore } from '@/entities/document/model/store';
import { ZOOM_MAX, ZOOM_MIN } from '@/shared/config/constants';

const ZOOM_SENSITIVITY = 0.001;

function computeNewPan(
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  zoom: number,
  newZoom: number,
): { newPanX: number; newPanY: number } {
  const worldX = (screenX - panX) / zoom;
  const worldY = (screenY - panY) / zoom;
  const newPanX = screenX - worldX * newZoom;
  const newPanY = screenY - worldY * newZoom;
  return { newPanX, newPanY };
}

export function useViewport(svgRef: React.RefObject<SVGSVGElement | null>) {
  const setViewport = useEditorStore((s) => s.setViewport);

  const isSpaceDown = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const isPanningNow = () => isPanning.current;

  // Wheel → zoom to cursor
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { panX, panY, zoom } = editorStoreApi.getState().viewport;

      const factor = 1 - e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.min(Math.max(zoom * factor, ZOOM_MIN), ZOOM_MAX);

      const rect = svg.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const { newPanX, newPanY } = computeNewPan(screenX, screenY, panX, panY, zoom, newZoom);
      setViewport({ zoom: newZoom, panX: newPanX, panY: newPanY });
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgRef, setViewport]);

  // Space key tracking
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpaceDown.current = true;
        if (svgRef.current) svgRef.current.style.cursor = 'grab';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDown.current = false;
        isPanning.current = false;
        panStart.current = null;
        if (svgRef.current) svgRef.current.style.cursor = '';
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    globalThis.addEventListener('keyup', onKeyUp);
    return () => {
      globalThis.removeEventListener('keydown', onKeyDown);
      globalThis.removeEventListener('keyup', onKeyUp);
    };
  }, [svgRef]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const isMiddleMouse = e.button === 1;
    if (!isSpaceDown.current && !isMiddleMouse) return;

    e.preventDefault();
    isPanning.current = true;
    const { panX, panY } = editorStoreApi.getState().viewport;
    panStart.current = { x: e.clientX, y: e.clientY, panX, panY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = 'grabbing';
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPanning.current || !panStart.current) return;

    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setViewport({ panX: panStart.current.panX + dx, panY: panStart.current.panY + dy });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPanning.current) return;

    isPanning.current = false;
    panStart.current = null;
    e.currentTarget.style.cursor = isSpaceDown.current ? 'grab' : '';
  };

  return { onPointerDown, onPointerMove, onPointerUp, isPanningNow } as const;
}
