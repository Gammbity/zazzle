import { useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Copy, Download, Layers3, Maximize2, Minus, Plus, Trash2 } from 'lucide-react';
import TshirtPrintEditor from './TshirtPrintEditor';
import { composeGarmentPreview } from './composeGarmentPreview';
import {
  garmentHasBack,
  getGarmentAsset,
  type GarmentSide,
  type GarmentType,
} from './garment-presets';
import type { useFabricHistory } from './FabricEditorControls';

interface GarmentStageProps {
  garment: GarmentType;
  viewSide: GarmentSide;
  onViewSideChange: (side: GarmentSide) => void;
  shirtColor: string;
  canvas: fabric.Canvas | null;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onTextureUpdate: (dataUrl: string, side: GarmentSide) => void;
  history: ReturnType<typeof useFabricHistory>;
}

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;

export default function GarmentStage({
  garment,
  viewSide,
  onViewSideChange,
  shirtColor,
  canvas,
  onCanvasReady,
  onTextureUpdate,
  history,
}: GarmentStageProps) {
  const asset = getGarmentAsset(garment, viewSide);
  const hasBack = garmentHasBack(garment);
  const [zoom, setZoom] = useState(100);
  const stageRef = useRef<HTMLDivElement>(null);
  const isWhite = shirtColor.toLowerCase() === '#ffffff';

  const handleDeleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (!activeObjects.length) return;
    canvas.discardActiveObject();
    canvas.remove(...activeObjects);
    canvas.requestRenderAll();
  };

  const handleDownload = async () => {
    if (!canvas) return;
    const designDataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const flattened = await composeGarmentPreview(asset.image, designDataUrl, asset.printArea);
    const link = document.createElement('a');
    link.download = `${garment}-${viewSide}.png`;
    link.href = flattened;
    link.click();
  };

  const handleFullscreen = () => {
    const node = stageRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void node.requestFullscreen?.();
    }
  };

  // Clicking the garment itself (outside the print area) deselects the
  // active object, so the blue selection handles can be cleared even when
  // the design fills the whole print area and leaves no empty canvas to
  // click on.
  const handleStageBackgroundClick = () => {
    if (!canvas || !canvas.getActiveObject()) return;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  };

  return (
    <div className='garment-stage-column'>
      <div className='garment-stage-frame' ref={stageRef}>
        {hasBack ? (
          <div className='garment-side-toggle'>
            <button
              type='button'
              className={`garment-side-btn ${viewSide === 'front' ? 'active' : ''}`}
              onClick={() => onViewSideChange('front')}
            >
              Old tomoni
            </button>
            <button
              type='button'
              className={`garment-side-btn ${viewSide === 'back' ? 'active' : ''}`}
              onClick={() => onViewSideChange('back')}
            >
              Orqa tomoni
            </button>
          </div>
        ) : null}

        <div
          className='garment-stage-zoomable'
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <div
            className='garment-photo-stack'
            onClick={handleStageBackgroundClick}
          >
            <img
              src={asset.image}
              alt={garment === 'hoodie' ? 'Hoodie' : 'Futbolka'}
              className='garment-photo-base'
            />
            {asset.tintable && !isWhite ? (
              <div
                className='garment-photo-tint'
                style={{
                  backgroundColor: shirtColor,
                  WebkitMaskImage: `url(${asset.image})`,
                  maskImage: `url(${asset.image})`,
                }}
              />
            ) : null}

            <div
              className='garment-print-area'
              style={{
                top: `${asset.printArea.top}%`,
                left: `${asset.printArea.left}%`,
                width: `${asset.printArea.width}%`,
                height: `${asset.printArea.height}%`,
              }}
            >
              <TshirtPrintEditor
                onCanvasReady={onCanvasReady}
                onTextureUpdate={onTextureUpdate}
                viewSide={viewSide}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='garment-canvas-toolbar'>
        <button
          type='button'
          className='garment-tool-icon-btn'
          disabled={!history.hasSelection}
          onClick={history.duplicateSelected}
          title='Nusxa olish'
          aria-label='Nusxa olish'
        >
          <Copy size={17} />
        </button>
        <button
          type='button'
          className='garment-tool-icon-btn'
          onClick={() =>
            document
              .getElementById('garment-layers-panel')
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          title='Qatlamlar'
          aria-label='Qatlamlar'
        >
          <Layers3 size={17} />
        </button>
        <button
          type='button'
          className='garment-tool-icon-btn'
          onClick={() => void handleDownload()}
          title='Yuklab olish'
          aria-label='Yuklab olish'
        >
          <Download size={17} />
        </button>
        <button
          type='button'
          className='garment-tool-icon-btn danger'
          disabled={!history.hasSelection}
          onClick={handleDeleteSelected}
          title="O'chirish"
          aria-label="O'chirish"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className='garment-zoom-controls'>
        <button
          type='button'
          className='garment-zoom-btn'
          onClick={() => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
          aria-label='Kichraytirish'
        >
          <Minus size={16} />
        </button>
        <span className='garment-zoom-value'>{zoom}%</span>
        <button
          type='button'
          className='garment-zoom-btn'
          onClick={() => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
          aria-label='Kattalashtirish'
        >
          <Plus size={16} />
        </button>
        <button
          type='button'
          className='garment-zoom-btn'
          onClick={handleFullscreen}
          aria-label="To'liq ekran"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}
