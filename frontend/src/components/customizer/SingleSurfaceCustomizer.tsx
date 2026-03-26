import { useState } from 'react';
import { fabric } from 'fabric';
import SingleSurfacePrintEditor from './SingleSurfacePrintEditor';
import SingleSurfaceSidebar from './SingleSurfaceSidebar';
import SingleSurfaceViewer from './SingleSurfaceViewer';
import type { SingleSurfaceCustomizerConfig } from './single-surface-presets';
import './customizer.css';

interface SingleSurfaceCustomizerProps {
  config: SingleSurfaceCustomizerConfig;
}

export default function SingleSurfaceCustomizer({
  config,
}: SingleSurfaceCustomizerProps) {
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [textureUrl, setTextureUrl] = useState('');

  return (
    <div className='app-container'>
      <div className='left-panel'>
        <SingleSurfaceViewer textureUrl={textureUrl} config={config.viewer} />

        <div className='print-editor-wrapper'>
          <SingleSurfacePrintEditor
            onCanvasReady={setFabricCanvas}
            onTextureUpdate={setTextureUrl}
            config={config.editor}
          />
        </div>
      </div>

      <div className='right-panel-container'>
        <SingleSurfaceSidebar canvas={fabricCanvas} config={config.sidebar} />
      </div>
    </div>
  );
}
