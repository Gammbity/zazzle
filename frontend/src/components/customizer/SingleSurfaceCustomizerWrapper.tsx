'use client';

import { useState } from 'react';
import { fabric } from 'fabric';
import './customizer.css';

interface ViewerProps {
  textureUrl: string;
}

interface PrintEditorProps {
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onTextureUpdate: (dataUrl: string) => void;
}

interface SidebarProps {
  canvas: fabric.Canvas | null;
}

interface SingleSurfaceCustomizerWrapperProps {
  Viewer: React.ComponentType<ViewerProps>;
  PrintEditor: React.ComponentType<PrintEditorProps>;
  Sidebar: React.ComponentType<SidebarProps>;
}

export default function SingleSurfaceCustomizerWrapper({
  Viewer,
  PrintEditor,
  Sidebar,
}: SingleSurfaceCustomizerWrapperProps) {
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [textureUrl, setTextureUrl] = useState('');

  return (
    <div className='app-container'>
      <div className='left-panel'>
        <Viewer textureUrl={textureUrl} />

        <div className='print-editor-wrapper'>
          <PrintEditor
            onCanvasReady={setFabricCanvas}
            onTextureUpdate={setTextureUrl}
          />
        </div>
      </div>

      <div className='right-panel-container'>
        <Sidebar canvas={fabricCanvas} />
      </div>
    </div>
  );
}
