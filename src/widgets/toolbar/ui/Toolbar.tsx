import { useRef } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { serialize, deserialize } from '@/features/persistence/lib/serialize';

export function Toolbar() {
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const activeTool = useEditorStore((state) => state.activeTool);
  const snapToGrid = useEditorStore((state) => state.grid.snapToGrid);
  const setGrid = useEditorStore((state) => state.setGrid);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const state = editorStoreApi.getState();
    const json = serialize(state.document, state.viewport, state.grid);
    const href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = 'editor.json';
    link.click();
    URL.revokeObjectURL(href);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const state = deserialize(text);
    if (!state) return;
    editorStoreApi.setState({ document: state.document, viewport: state.viewport, grid: state.grid });
  };

  return (
    <div className="toolbar">
      <button
        className={`toolbar__button ${activeTool === 'select' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('select')}
      >
        Select
      </button>
      <button
        className={`toolbar__button ${activeTool === 'rect' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('rect')}
      >
        Rect
      </button>
      <button
        className={`toolbar__button ${activeTool === 'ellipse' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('ellipse')}
      >
        Ellipse
      </button>
      <button
        className={`toolbar__button ${activeTool === 'pan' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('pan')}
      >
        Pan
      </button>
      <div style={{ width: 1, background: 'var(--color-border)', margin: '8px 4px' }} />
      <button
        className={`toolbar__button ${snapToGrid ? 'toolbar__button--active' : ''}`}
        onClick={() => setGrid({ snapToGrid: !snapToGrid })}
      >
        Snap
      </button>
      <div style={{ width: 1, background: 'var(--color-border)', margin: '8px 4px' }} />
      <button className="toolbar__button" onClick={handleExport}>
        Export
      </button>
      <button className="toolbar__button" onClick={() => fileInputRef.current?.click()}>
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
      <div style={{ width: 1, background: 'var(--color-border)', margin: '8px 4px' }} />
      <button className="toolbar__button" onClick={undo} disabled={!canUndo}>
        ↩ Undo
      </button>
      <button className="toolbar__button" onClick={redo} disabled={!canRedo}>
        ↪ Redo
      </button>
    </div>
  );
}
