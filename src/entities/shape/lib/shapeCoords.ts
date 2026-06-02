import type { Shape } from '@/entities/document/model/types';
import type { Bbox } from '@/shared/lib/bbox';

export function getRootShapeId(shapeId: string, shapes: Record<string, Shape>): string {
  let rootId = shapeId;
  while (shapes[rootId]?.parentId) {
    rootId = shapes[rootId].parentId!;
  }
  return rootId;
}

export function getShapeWorldOrigin(shape: Shape, shapes: Record<string, Shape>): { x: number; y: number } {
  if (!shape.parentId) return { x: shape.x, y: shape.y };
  const parent = shapes[shape.parentId];
  if (!parent) return { x: shape.x, y: shape.y };
  const parentOrigin = getShapeWorldOrigin(parent, shapes);
  return { x: parentOrigin.x + shape.x, y: parentOrigin.y + shape.y };
}

export function getShapeWorldBbox(shape: Shape, shapes: Record<string, Shape>): Bbox {
  const origin = getShapeWorldOrigin(shape, shapes);
  return { x: origin.x, y: origin.y, width: shape.width, height: shape.height };
}

export type SelectionOverlayItem = {
  id: string;
  bbox: Bbox;
  rotation: number;
  showHandles: boolean;
};

export function getSelectionOverlayItems(
  selection: string[],
  shapes: Record<string, Shape>,
): SelectionOverlayItem[] {
  const items: SelectionOverlayItem[] = [];
  for (const id of selection) {
    const shape = shapes[id];
    if (!shape) continue;
    if (shape.type === 'group') {
      for (const childId of shape.childIds) {
        const child = shapes[childId];
        if (!child) continue;
        items.push({
          id: childId,
          bbox: getShapeWorldBbox(child, shapes),
          rotation: child.rotation,
          showHandles: false,
        });
      }
    } else {
      items.push({
        id,
        bbox: getShapeWorldBbox(shape, shapes),
        rotation: shape.rotation,
        showHandles: true,
      });
    }
  }
  return items;
}
