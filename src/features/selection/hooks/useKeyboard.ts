import { useEffect } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { applyCommand } from '@/entities/document/model/commands';
import { DeleteShapeCommand } from '@/entities/document/model/commands/DeleteShapeCommand';
import { ReorderLayerCommand } from '@/entities/document/model/commands/ReorderLayerCommand';
import type { EditorDocument } from '@/entities/document/model/types';

const isDeleteKey = (key: string) => key === 'Delete' || key === 'Backspace';
const isLayerMoveKey = (key: string) => key === '[' || key === ']';

function deleteSelectedShapes(selection: string[], doc: EditorDocument): void {
  selection.forEach((id) => {
    if (doc.shapes[id]?.locked) return;
    applyCommand(new DeleteShapeCommand(id), editorStoreApi);
  });
}

function getMovedRootChildIds(doc: EditorDocument, activeId: string, key: string): string[] | null {
  const index = doc.rootChildIds.indexOf(activeId);
  if (index === -1) return null;

  const targetIndex = key === '[' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= doc.rootChildIds.length) return null;

  const nextIds = [...doc.rootChildIds];
  [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];
  return nextIds;
}

function handleDeleteKey(e: KeyboardEvent, selection: string[], doc: EditorDocument): boolean {
  if (!isDeleteKey(e.key)) return false;
  if (selection.length === 0) return true;

  e.preventDefault();
  deleteSelectedShapes(selection, doc);
  return true;
}

function handleLayerMoveKey(e: KeyboardEvent, selection: string[], doc: EditorDocument): boolean {
  if (!isLayerMoveKey(e.key)) return false;
  if (selection.length === 0) return true;

  const nextIds = getMovedRootChildIds(doc, selection[0], e.key);
  if (!nextIds) return true;

  e.preventDefault();
  applyCommand(new ReorderLayerCommand([...doc.rootChildIds], nextIds), editorStoreApi);
  return true;
}

function handleHistoryKey(e: KeyboardEvent): boolean {
  const key = e.key.toLowerCase();
  const isUndo = e.ctrlKey && key === 'z' && !e.shiftKey;
  const isRedo = e.ctrlKey && (key === 'y' || (key === 'z' && e.shiftKey));
  if (!isUndo && !isRedo) return false;

  e.preventDefault();
  if (isUndo) {
    editorStoreApi.getState().undo();
  } else {
    editorStoreApi.getState().redo();
  }
  return true;
}

export function useKeyboard() {
  const selection = useEditorStore((s) => s.selection);
  const doc = useEditorStore((s) => s.document);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (handleDeleteKey(e, selection, doc)) return;
      if (handleLayerMoveKey(e, selection, doc)) return;
      handleHistoryKey(e);
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selection, doc]);
}
