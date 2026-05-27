import { useEffect } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { applyCommand } from '@/entities/document/model/commands';
import { DeleteShapeCommand } from '@/entities/document/model/commands/DeleteShapeCommand';

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
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selection, doc]);
}
