import { Canvas } from '@/widgets/canvas/ui/Canvas';
import { Toolbar } from '@/widgets/toolbar/ui/Toolbar';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100dvh' }}>
      <Toolbar />
      <Canvas />
    </div>
  );
}
