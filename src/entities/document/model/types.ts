type ShapeBase = {
  id: string;
  name: string;
  parentId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // radians, вокруг центра bbox
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
};

export type RectShape = ShapeBase & { type: 'rect' };
export type EllipseShape = ShapeBase & { type: 'ellipse' };
export type GroupShape = ShapeBase & { type: 'group'; childIds: string[] };
export type Shape = RectShape | EllipseShape | GroupShape;

export type EditorDocument = {
  shapes: Record<string, Shape>;
  rootChildIds: string[];
};

export type ViewportState = {
  panX: number;
  panY: number;
  zoom: number;
};

export type ActiveTool = 'select' | 'rect' | 'ellipse' | 'pan';

export type InteractionMode = 'idle' | 'drag' | 'resize' | 'rotate' | 'marquee' | 'create';

export type InteractionState = {
  mode: Exclude<InteractionMode, 'idle'>;
  shapesSnapshot: Record<string, Shape>;
  marqueeRect?: { x: number; y: number; width: number; height: number };
  snapGuides?: { guideX?: number; guideY?: number };
} | null;
