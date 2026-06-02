import { useEffect } from 'react';
import { editorStoreApi } from '@/entities/document/model/store';
import type { ActiveTool } from '@/entities/document/model/types';
import { applyCommand } from '@/entities/document/model/commands';
import { DeleteShapeCommand } from '@/entities/document/model/commands/DeleteShapeCommand';
import { ReorderLayerCommand } from '@/entities/document/model/commands/ReorderLayerCommand';
import { groupSelectedShapes, ungroupSelectedShape } from '@/features/selection/lib/groupSelection';
import { isEditableTarget, isModKey, Key, matchesCode } from '@/shared/lib/keyboard';

const TOOL_BY_CODE: Partial<Record<string, ActiveTool>> = {
  [Key.KeyV]: 'select',
  [Key.KeyR]: 'rect',
  [Key.KeyE]: 'ellipse',
};

function handleDeleteKey(e: KeyboardEvent): boolean {
  if (!matchesCode(e, Key.Delete) && !matchesCode(e, Key.Backspace)) return false;
  const { selection, document: doc } = editorStoreApi.getState();
  if (selection.length === 0) return true;
  e.preventDefault();
  selection.forEach((id) => {
    if (doc.shapes[id]?.locked) return;
    applyCommand(new DeleteShapeCommand(id), editorStoreApi);
  });
  return true;
}

function handleLayerMoveKey(e: KeyboardEvent): boolean {
  const moveUp = matchesCode(e, Key.BracketLeft);
  const moveDown = matchesCode(e, Key.BracketRight);
  if (!moveUp && !moveDown) return false;

  const { selection, document: doc } = editorStoreApi.getState();
  if (selection.length === 0) return true;

  const index = doc.rootChildIds.indexOf(selection[0]);
  if (index === -1) return true;

  const targetIndex = moveUp ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= doc.rootChildIds.length) return true;

  e.preventDefault();
  const nextIds = [...doc.rootChildIds];
  [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];
  applyCommand(new ReorderLayerCommand([...doc.rootChildIds], nextIds), editorStoreApi);
  return true;
}

function handleToolKey(e: KeyboardEvent): boolean {
  if (isModKey(e) || e.altKey) return false;
  const tool = TOOL_BY_CODE[e.code];
  if (!tool) return false;
  e.preventDefault();
  editorStoreApi.getState().setActiveTool(tool);
  return true;
}

function handleGroupKey(e: KeyboardEvent): boolean {
  if (!matchesCode(e, Key.KeyG) || !isModKey(e)) return false;
  e.preventDefault();
  e.stopPropagation();
  if (e.shiftKey) ungroupSelectedShape();
  else groupSelectedShapes();
  return true;
}

function handleHistoryKey(e: KeyboardEvent): boolean {
  const isUndo = isModKey(e) && matchesCode(e, Key.KeyZ) && !e.shiftKey;
  const isRedo = isModKey(e) && (matchesCode(e, Key.KeyY) || (matchesCode(e, Key.KeyZ) && e.shiftKey));
  if (!isUndo && !isRedo) return false;
  e.preventDefault();
  if (isUndo) editorStoreApi.getState().undo();
  else editorStoreApi.getState().redo();
  return true;
}

export function useKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e)) return;
      if (handleToolKey(e)) return;
      if (handleDeleteKey(e)) return;
      if (handleLayerMoveKey(e)) return;
      if (handleGroupKey(e)) return;
      handleHistoryKey(e);
    };
    globalThis.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => globalThis.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);
}
