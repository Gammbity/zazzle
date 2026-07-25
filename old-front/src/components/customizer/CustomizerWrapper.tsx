import { useState } from 'react';
import { fabric } from 'fabric';
import MugViewer from './MugViewer';
import PrintEditor from './PrintEditor';
import Sidebar from './Sidebar';
import FabricEditorControls from './FabricEditorControls';
import './customizer.css';

export default function MugCustomizer() {
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
        <MugViewer
          scale={0.1}
          fabricCanvas={fabricCanvas}
          textureVersion={textureVersion}
          textureOffset={textureOffset}
          textureRepeat={textureRepeat}
          mugColor={mugColor}
        />

        <div className='editor-workspace'>
          <div className='print-editor-wrapper'>
            <PrintEditor
              onCanvasReady={handleCanvasReady}
              onTextureUpdate={handleTextureUpdate}
              mugColor={mugColor}
            />
          </div>
          <FabricEditorControls
            canvas={fabricCanvas}
            draftKey='zazzle:editor:mug'
          />
        </div>
      </div>

      <div className='right-panel-container'>
        <Sidebar
          canvas={fabricCanvas}
          textureOffset={textureOffset}
          setTextureOffset={setTextureOffset}
          textureRepeat={textureRepeat}
          setTextureRepeat={setTextureRepeat}
          mugColor={mugColor}
          setMugColor={setMugColor}
        />
      </div>
    </div>
  );
}
