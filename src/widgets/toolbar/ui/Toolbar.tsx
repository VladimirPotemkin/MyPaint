import { useEditorStore } from "@/entities/document/model/store";

export function Toolbar() {
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const activeTool = useEditorStore((state) => state.activeTool);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  return (
    <div className="toolbar">
      <button className={`toolbar__button ${activeTool === 'select' ? 'toolbar__button--active' : ''}`} onClick={() => setActiveTool('select')}>Select</button>
      <button className={`toolbar__button ${activeTool === 'rect' ? 'toolbar__button--active' : ''}`} onClick={() => setActiveTool('rect')}>Rect</button>
      <button className={`toolbar__button ${activeTool === 'ellipse' ? 'toolbar__button--active' : ''}`} onClick={() => setActiveTool('ellipse')}>Ellipse</button>
      <button className={`toolbar__button ${activeTool === 'pan' ? 'toolbar__button--active' : ''}`} onClick={() => setActiveTool('pan')}>Pan</button>
      <div style={{ width: 1, background: 'var(--color-border)', margin: '8px 4px' }} />
      <button className="toolbar__button" onClick={undo} disabled={!canUndo}>↩ Undo</button>
      <button className="toolbar__button" onClick={redo} disabled={!canRedo}>↪ Redo</button>
    </div>
  );
}