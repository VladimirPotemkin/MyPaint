import { useEditorStore } from "@/entities/document/model/store";

export function Toolbar() {
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const activeTool = useEditorStore((state) => state.activeTool);

  return (
    <div className="toolbar">
      <button className={`toolbar__button ${activeTool === 'select' ? 'toolbar__button--active' : ''}`} onClick={() => setActiveTool('select')}>Select</button>
      <button className={`toolbar__button ${activeTool === 'rect' ? 'toolbar__button--active' : ''}`} onClick={() => setActiveTool('rect')}>Rect</button>
      <button className={`toolbar__button ${activeTool === 'ellipse' ? 'toolbar__button--active' : ''}`} onClick={() => setActiveTool('ellipse')}>Ellipse</button>
      <button className={`toolbar__button ${activeTool === 'pan' ? 'toolbar__button--active' : ''}`} onClick={() => setActiveTool('pan')}>Pan</button>
    </div>
  );
}