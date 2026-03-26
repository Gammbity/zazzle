import { lazy, Suspense, useState } from 'react';
import { fabric } from 'fabric';
import './customizer.css';

const MugViewer = lazy(() => import('./MugViewer'));
const PrintEditor = lazy(() => import('./PrintEditor'));
const Sidebar = lazy(() => import('./Sidebar'));

function PanelFallback({ minHeight }: { minHeight: number }) {
  return (
    <div
      className='flex items-center justify-center rounded-lg border border-slate-200 bg-white/70'
      style={{ minHeight }}
    >
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600' />
    </div>
  );
}

export default function App() {
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [textureVersion, setTextureVersion] = useState(0);
  const [mugColor, setMugColor] = useState('#ffffff');
  const [textureOffset, setTextureOffset] = useState({ x: 0.0, y: 0 });
  const [textureRepeat, setTextureRepeat] = useState({ x: 1.0, y: 1 });

  const handleCanvasReady = (canvas: fabric.Canvas) => {
    setFabricCanvas(canvas);
  };

  const handleTextureUpdate = () => {
    setTextureVersion(v => v + 1);
  };

  return (
    <div className='app-container'>
      <div className='left-panel'>
        <Suspense fallback={<PanelFallback minHeight={420} />}>
          <MugViewer
            scale={0.1}
            fabricCanvas={fabricCanvas}
            textureVersion={textureVersion}
            textureOffset={textureOffset}
            textureRepeat={textureRepeat}
            mugColor={mugColor}
          />
        </Suspense>

        <div className='print-editor-wrapper'>
          <Suspense fallback={<PanelFallback minHeight={220} />}>
            <PrintEditor
              onCanvasReady={handleCanvasReady}
              onTextureUpdate={handleTextureUpdate}
              mugColor={mugColor}
            />
          </Suspense>
        </div>
      </div>

      <div className='right-panel-container'>
        <Suspense fallback={<PanelFallback minHeight={480} />}>
          <Sidebar
            canvas={fabricCanvas}
            textureOffset={textureOffset}
            setTextureOffset={setTextureOffset}
            textureRepeat={textureRepeat}
            setTextureRepeat={setTextureRepeat}
            mugColor={mugColor}
            setMugColor={setMugColor}
          />
        </Suspense>
      </div>
    </div>
  );
}
