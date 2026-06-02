import { useEffect } from 'react';
import { Canvas } from '@/widgets/canvas/ui/Canvas';
import { Toolbar } from '@/widgets/toolbar/ui/Toolbar';
import { LayersPanel } from '@/widgets/layers-panel/ui/LayersPanel';
import { editorStoreApi } from '@/entities/document/model/store';
import { deserialize, STORAGE_KEY } from '@/features/persistence/lib/serialize';
import { useAutosave } from '@/features/persistence/hooks/useAutosave';
import { useKeyboard } from '@/features/selection/hooks/useKeyboard';

export default function App() {
  useKeyboard();
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = deserialize(raw);
    if (!state) return;
    editorStoreApi.setState({ document: state.document, viewport: state.viewport, grid: state.grid });
  }, []);

  useAutosave();

  return (
    <div style={{ width: '100vw', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Toolbar />
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          paddingTop: 'var(--toolbar-height)',
        }}
      >
        <Canvas />
        <LayersPanel />
      </div>
    </div>
  );
}
