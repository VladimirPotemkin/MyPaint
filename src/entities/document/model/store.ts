import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GRID_DEFAULT_SIZE, HISTORY_LIMIT } from '@/shared/config/constants';
import type { Shape, EditorDocument, ViewportState, ActiveTool, InteractionState } from './types';
import type { Command } from './commands';

export type EditorStore = {
  // ── Слайс document ──────────────────────────────
  document: EditorDocument;
  addShape: (shape: Shape) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  removeShape: (id: string) => void;
  setRootChildIds: (ids: string[]) => void;

  // ── Слайс color ─────────────────────────────────
  activeFill: string;
  activeStroke: string;
  setActiveColors: (patch: { fill?: string; stroke?: string }) => void;

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

  // ── Слайс history ───────────────────────────────
  past: Command[];
  future: Command[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
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
    (set, get) => ({
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
            selection: s.selection.filter((i) => i !== id),
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

      // color
      activeFill: '#4f8ef7',
      activeStroke: 'transparent',
      setActiveColors: (patch) =>
        set((s) => ({
          activeFill: patch.fill ?? s.activeFill,
          activeStroke: patch.stroke ?? s.activeStroke,
        })),

      // ui
      grid: { enabled: true, size: GRID_DEFAULT_SIZE, snapToGrid: false },
      setGrid: (patch) => set((s) => ({ grid: { ...s.grid, ...patch } })),

      // interaction
      interaction: null,
      setInteraction: (state) => set({ interaction: state }),

      // history
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
      undo: () => {
        const { past, future } = get();
        if (past.length === 0) return;
        const cmd = past.at(-1)!;
        cmd.undo(useEditorStore);
        const newPast = past.slice(0, -1);
        const newFuture = [cmd, ...future].slice(0, HISTORY_LIMIT);
        set({ past: newPast, future: newFuture, canUndo: newPast.length > 0, canRedo: true });
      },
      redo: () => {
        const { past, future } = get();
        if (future.length === 0) return;
        const [cmd, ...rest] = future;
        cmd.execute(useEditorStore);
        const newPast = [...past, cmd].slice(-HISTORY_LIMIT);
        set({ past: newPast, future: rest, canUndo: true, canRedo: rest.length > 0 });
      },
    }),
    { name: 'EditorStore' },
  ),
);

export const editorStoreApi = useEditorStore;
