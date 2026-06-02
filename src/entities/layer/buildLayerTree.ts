import type { EditorDocument, Shape } from '@/entities/document/model/types';

export type LayerTreeNode = Shape & { children: LayerTreeNode[] };

const buildNode = (doc: EditorDocument, id: string): LayerTreeNode | null => {
  const shape = doc.shapes[id];
  return shape
    ? {
        ...shape,
        children:
          shape.type === 'group'
            ? shape.childIds
                .map((childId) => buildNode(doc, childId))
                .filter((node): node is LayerTreeNode => node !== null)
            : [],
      }
    : null;
};

export const buildLayerTree = (doc: EditorDocument): LayerTreeNode[] =>
  doc.rootChildIds
    .map((id) => buildNode(doc, id))
    .filter((node): node is LayerTreeNode => node !== null);
