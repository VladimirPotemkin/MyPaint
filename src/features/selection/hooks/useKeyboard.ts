import { useEffect } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { applyCommand } from '@/entities/document/model/commands';
import { DeleteShapeCommand } from '@/entities/document/model/commands/DeleteShapeCommand';
import { ReorderLayerCommand } from '@/entities/document/model/commands/ReorderLayerCommand';

export function useKeyboard() {
  const selection = useEditorStore((s) => s.selection);
  const doc = useEditorStore((s) => s.document);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.length === 0) return;
        e.preventDefault();
        selection.forEach((id) => {
          if (doc.shapes[id]?.locked) return;
          applyCommand(new DeleteShapeCommand(id), editorStoreApi);
        });
      }
      if (e.key === '[' || e.key === ']') {
        if (selection.length === 0) return;
        const activeId = selection[0];
        const index = doc.rootChildIds.indexOf(activeId);
        if (index === -1) return;
        e.preventDefault();
        const newIds = [...doc.rootChildIds];
        if (e.key === '[' && index > 0) {
          [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
        } else if (e.key === ']' && index < newIds.length - 1) {
          [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
        } else return;
        applyCommand(new ReorderLayerCommand([...doc.rootChildIds], newIds), editorStoreApi);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selection, doc]);
}
