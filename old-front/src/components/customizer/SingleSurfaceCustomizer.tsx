import { useState } from 'react';
import { fabric } from 'fabric';
import SingleSurfacePrintEditor from './SingleSurfacePrintEditor';
import SingleSurfaceSidebar from './SingleSurfaceSidebar';
import SingleSurfaceViewer from './SingleSurfaceViewer';
import CustomizerPurchaseControls from './CustomizerPurchaseControls';
import FabricEditorControls from './FabricEditorControls';
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
  const surfaces = config.surfaces ?? [{ id: 'front', label: 'Old tomoni' }];
  const [activeSurfaceId, setActiveSurfaceId] = useState(surfaces[0].id);
  const draftKey = `zazzle:editor:${config.productSlug}:${activeSurfaceId}`;

  return (
    <div className='app-container'>
      <div className='left-panel'>
        <SingleSurfaceViewer textureUrl={textureUrl} config={config.viewer} />

        <div className='editor-workspace'>
          <div className='print-editor-wrapper'>
            <SingleSurfacePrintEditor
              onCanvasReady={setFabricCanvas}
              onTextureUpdate={setTextureUrl}
              config={config.editor}
            />
          </div>
          <FabricEditorControls canvas={fabricCanvas} draftKey={draftKey} />
        </div>
      </div>

      <div className='right-panel-container'>
        {surfaces.length > 1 ? (
          <div className='tshirt-view-toggle'>
            {surfaces.map(surface => (
              <button
                key={surface.id}
                type='button'
                className={`action-btn ${activeSurfaceId === surface.id ? 'primary' : ''}`}
                onClick={() => setActiveSurfaceId(surface.id)}
              >
                {surface.label}
              </button>
            ))}
          </div>
        ) : null}
        <SingleSurfaceSidebar canvas={fabricCanvas} config={config.sidebar} />
        <CustomizerPurchaseControls
          canvas={fabricCanvas}
          productSlug={config.productSlug}
          productName={config.productName}
          surfaceId={activeSurfaceId}
          previewDataUrl={textureUrl}
          getEditorState={() => ({
            surfaces: surfaces.map(surface => ({
              id: surface.id,
              fabric_json: window.localStorage.getItem(
                `zazzle:editor:${config.productSlug}:${surface.id}`
              ),
            })),
          })}
        />
      </div>
    </div>
  );
}
