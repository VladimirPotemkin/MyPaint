import { Canvas } from '@/widgets/canvas/ui/Canvas';
import { Toolbar } from '@/widgets/toolbar/ui/Toolbar';
import { LayersPanel } from '@/widgets/layers-panel/ui/LayersPanel';

export default function App() {
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
