import { useEffect } from 'react';
import { useEditorStore } from '@/entities/document/model/store';
import { serialize, STORAGE_KEY } from '../lib/serialize';
import { AUTOSAVE_DEBOUNCE_MS } from '@/shared/config/constants';

export function useAutosave() {
  const document = useEditorStore((s) => s.document);
  const viewport = useEditorStore((s) => s.viewport);
  const grid = useEditorStore((s) => s.grid);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, serialize(document, viewport, grid));
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [document, viewport, grid]);
}
