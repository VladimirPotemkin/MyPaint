import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GRID_DEFAULT_SIZE, ZOOM_MIN, ZOOM_MAX } from '@/shared/config/constants';
import type { Shape, EditorDocument, ViewportState, ActiveTool, InteractionState } from './types';

export type EditorStore = {
  // ── Слайс document ──────────────────────────────
  document: EditorDocument;
  addShape: (shape: Shape) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  removeShape: (id: string) => void;
  setRootChildIds: (ids: string[]) => void;

  // ── Слайс selection ─────────────────────────────
  selection: string[];
  setSelection: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  // ── Слайс viewport ──────────────────────────────
  viewport: ViewportState;
  setViewport: (patch: Partial<ViewportState>) => void;

  // ── Слайс tool ──────────────────────────────────
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;

  // ── Слайс ui (сетка) ────────────────────────────
  grid: { enabled: boolean; size: number; snapToGrid: boolean };
  setGrid: (patch: Partial<EditorStore['grid']>) => void;

  // ── Слайс interaction (transient, не в history) ──
  interaction: InteractionState;
  setInteraction: (state: InteractionState) => void;

  // ── Слайс history (заглушка до Этапа 9) ─────────
  canUndo: boolean;
  canRedo: boolean;
};

const DEMO_SHAPE_ID = crypto.randomUUID();

const initialDocument: EditorDocument = {
  shapes: {
    [DEMO_SHAPE_ID]: {
      id: DEMO_SHAPE_ID,
      type: 'rect',
      name: 'Demo Rect',
      parentId: null,
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      rotation: 0,
      fill: '#4f8ef7',
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 1,
      visible: true,
      locked: false,
    },
  },
  rootChildIds: [DEMO_SHAPE_ID],
};

export const useEditorStore = create<EditorStore>()(
  devtools(
    (set) => ({
      // document
      document: initialDocument,
      addShape: (shape) =>
        set((s) => ({
          document: {
            shapes: { ...s.document.shapes, [shape.id]: shape },
            rootChildIds: [...s.document.rootChildIds, shape.id],
          },
        })),
      updateShape: (id, patch) =>
        set((s) => ({
          document: {
            ...s.document,
            shapes: {
              ...s.document.shapes,
              [id]: { ...s.document.shapes[id], ...patch } as Shape,
            },
          },
        })),
      removeShape: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.document.shapes;
          return {
            document: {
              shapes: rest,
              rootChildIds: s.document.rootChildIds.filter((i) => i !== id),
            },
          };
        }),
      setRootChildIds: (ids) => set((s) => ({ document: { ...s.document, rootChildIds: ids } })),

      // selection
      selection: [],
      setSelection: (ids) => set({ selection: ids }),
      toggleSelection: (id) =>
        set((s) => ({
          selection: s.selection.includes(id)
            ? s.selection.filter((i) => i !== id)
            : [...s.selection, id],
        })),
      clearSelection: () => set({ selection: [] }),

      // viewport
      viewport: { panX: 0, panY: 0, zoom: 1 },
      setViewport: (patch) => set((s) => ({ viewport: { ...s.viewport, ...patch } })),

      // tool
      activeTool: 'select',
      setActiveTool: (tool) => set({ activeTool: tool }),

      // ui
      grid: { enabled: true, size: GRID_DEFAULT_SIZE, snapToGrid: false },
      setGrid: (patch) => set((s) => ({ grid: { ...s.grid, ...patch } })),

      // interaction
      interaction: null,
      setInteraction: (state) => set({ interaction: state }),

      // history stub
      canUndo: false,
      canRedo: false,
    }),
    { name: 'EditorStore' },
  ),
);

export const editorStoreApi = useEditorStore;
