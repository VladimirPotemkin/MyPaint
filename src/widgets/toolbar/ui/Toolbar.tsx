import { useRef } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { serialize, deserialize } from '@/features/persistence/lib/serialize';
import { groupSelectedShapes, ungroupSelectedShape } from '@/features/selection/lib/groupSelection';

export function Toolbar() {
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const activeTool = useEditorStore((state) => state.activeTool);
  const snapToGrid = useEditorStore((state) => state.grid.snapToGrid);
  const setGrid = useEditorStore((state) => state.setGrid);
  const selection = useEditorStore((state) => state.selection);
  const rootChildIds = useEditorStore((state) => state.document.rootChildIds);
  const shapes = useEditorStore((state) => state.document.shapes);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const rootSelectedCount = selection.filter((id) => rootChildIds.includes(id)).length;
  const canGroup = rootSelectedCount >= 2;
  const canUngroup = selection.length === 1 && shapes[selection[0]]?.type === 'group';
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
    editorStoreApi.setState({
      document: state.document,
      viewport: state.viewport,
      grid: state.grid,
    });
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Editor tools">
      <button
        className={`toolbar__button ${activeTool === 'select' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('select')}
        aria-label="Select tool"
        aria-pressed={activeTool === 'select'}
        title="Select (V)"
      >
        Select
      </button>
      <button
        className={`toolbar__button ${activeTool === 'rect' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('rect')}
        aria-label="Rectangle tool"
        aria-pressed={activeTool === 'rect'}
        title="Rectangle (R)"
      >
        Rect
      </button>
      <button
        className={`toolbar__button ${activeTool === 'ellipse' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('ellipse')}
        aria-label="Ellipse tool"
        aria-pressed={activeTool === 'ellipse'}
        title="Ellipse (E)"
      >
        Ellipse
      </button>
      <button
        className={`toolbar__button ${activeTool === 'triangle' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('triangle')}
        aria-label="Triangle tool"
        aria-pressed={activeTool === 'triangle'}
        title="Triangle (T)"
      >
        Triangle
      </button>
      <button
        className={`toolbar__button ${activeTool === 'star' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('star')}
        aria-label="Star tool"
        aria-pressed={activeTool === 'star'}
        title="Star (S)"
      >
        Star
      </button>
      <button
        className={`toolbar__button ${activeTool === 'pan' ? 'toolbar__button--active' : ''}`}
        onClick={() => setActiveTool('pan')}
        aria-label="Pan tool"
        aria-pressed={activeTool === 'pan'}
        title="Pan (Space + drag)"
      >
        Pan
      </button>
      <div style={{ width: 1, background: 'var(--color-border)', margin: '8px 4px' }} aria-hidden="true" />
      <button
        className={`toolbar__button ${snapToGrid ? 'toolbar__button--active' : ''}`}
        onClick={() => setGrid({ snapToGrid: !snapToGrid })}
        aria-label="Toggle snap to grid"
        aria-pressed={snapToGrid}
        title="Snap to grid"
      >
        Snap
      </button>
      <div style={{ width: 1, background: 'var(--color-border)', margin: '8px 4px' }} aria-hidden="true" />
      <button
        type="button"
        className="toolbar__button"
        onClick={groupSelectedShapes}
        disabled={!canGroup}
        aria-label="Group selection"
        title="Group (Ctrl+G)"
      >
        Group
      </button>
      <button
        type="button"
        className="toolbar__button"
        onClick={ungroupSelectedShape}
        disabled={!canUngroup}
        aria-label="Ungroup"
        title="Ungroup (Ctrl+Shift+G)"
      >
        Ungroup
      </button>
      <div style={{ width: 1, background: 'var(--color-border)', margin: '8px 4px' }} aria-hidden="true" />
      <button
        className="toolbar__button"
        onClick={handleExport}
        aria-label="Export as JSON"
        title="Export scene as JSON"
      >
        Export
      </button>
      <button
        className="toolbar__button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Import JSON"
        title="Import scene from JSON"
      >
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
      <div style={{ width: 1, background: 'var(--color-border)', margin: '8px 4px' }} aria-hidden="true" />
      <button
        className="toolbar__button"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        ↩ Undo
      </button>
      <button
        className="toolbar__button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
      >
        ↪ Redo
      </button>
    </div>
  );
}
