import { useState } from 'react';
import { fabric } from 'fabric';
import { CheckCircle } from 'lucide-react';
import TshirtViewer from './TshirtViewer';
import type { GarmentType } from './TshirtViewer';
import TshirtPrintEditor from './TshirtPrintEditor';
import FabricEditorControls from './FabricEditorControls';
import CustomizerPurchaseControls from './CustomizerPurchaseControls';
import SingleSurfaceSidebar from './SingleSurfaceSidebar';
import type { SingleSurfaceSidebarConfig } from './single-surface-presets';
import './customizer.css';

const GARMENT_COLORS = [
  { name: 'Oq', value: '#ffffff' },
  { name: 'Qora', value: '#1a1a1a' },
  { name: 'Kulrang', value: '#9ca3af' },
  { name: "To'q ko'k", value: '#1e3a8a' },
  { name: 'Qizil', value: '#991b1b' },
  { name: 'Yashil', value: '#065f46' },
  { name: 'Sariq', value: '#eab308' },
  { name: 'Binafsha', value: '#7c3aed' },
];

const GARMENT_SIDEBAR_CONFIG: SingleSurfaceSidebarConfig = {
  title: 'Kiyim dizayneri',
  description: 'Old va orqa tomonni o‘zingizga moslang.',
  defaultText: 'Tahrirlash uchun bosing',
  defaultTextFontSize: 40,
  stickerFontSize: 60,
  stickers: [
    '⭐',
    '❤️',
    '🔥',
    '☕',
    '🐱',
    '🌹',
    '💻',
    '🚀',
    '🎨',
    '🎵',
    '🌈',
    '✨',
  ],
};

export default function TshirtWrapper({
  garment = 't-shirt',
}: {
  garment?: GarmentType;
}) {
  const product =
    garment === 'hoodie'
      ? { slug: 'hoodie', name: 'Hoodie' }
      : { slug: 't-shirt', name: 'Futbolka' };
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [frontTextureUrl, setFrontTextureUrl] = useState('');
  const [backTextureUrl, setBackTextureUrl] = useState('');
  const [shirtColor, setShirtColor] = useState('#ffffff');
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');
  const draftKey = `zazzle:editor:${product.slug}:${viewSide}`;

  const handleTextureUpdate = (url: string, side: 'front' | 'back') => {
    if (side === 'front') setFrontTextureUrl(url);
    else setBackTextureUrl(url);
  };

  return (
    <div className='app-container'>
      <div className='left-panel'>
        <TshirtViewer
          frontTextureUrl={frontTextureUrl}
          backTextureUrl={backTextureUrl}
          shirtColor={shirtColor}
          viewSide={viewSide}
          garment={garment}
        />

        <div className='editor-workspace'>
          <div className='print-editor-wrapper tshirt-print-editor-wrapper'>
            <TshirtPrintEditor
              onCanvasReady={setFabricCanvas}
              onTextureUpdate={handleTextureUpdate}
              viewSide={viewSide}
            />
          </div>
          <FabricEditorControls canvas={fabricCanvas} draftKey={draftKey} />
        </div>
      </div>

      <div className='right-panel-container'>
        <div className='tshirt-sidebar-options'>
          <div className='tshirt-view-toggle'>
            <button
              type='button'
              className={`action-btn ${viewSide === 'front' ? 'primary' : ''}`}
              onClick={() => setViewSide('front')}
            >
              Old tomoni
            </button>
            <button
              type='button'
              className={`action-btn ${viewSide === 'back' ? 'primary' : ''}`}
              onClick={() => setViewSide('back')}
            >
              Orqa tomoni
            </button>
          </div>
        </div>

        <SingleSurfaceSidebar
          canvas={fabricCanvas}
          config={GARMENT_SIDEBAR_CONFIG}
          showImageFitControls={false}
          settings={
            <div className='panel'>
              <div className='config-section'>
                <h4 className='config-title'>{product.name} rangi</h4>
                <div className='color-palette'>
                  {GARMENT_COLORS.map(color => (
                    <button
                      key={color.value}
                      type='button'
                      className='color-swatch'
                      style={{ backgroundColor: color.value }}
                      onClick={() => setShirtColor(color.value)}
                      title={color.name}
                      aria-label={color.name}
                      aria-pressed={shirtColor === color.value}
                    >
                      {shirtColor === color.value ? (
                        <CheckCircle
                          size={14}
                          color={
                            color.value === '#ffffff' ? '#3b82f6' : '#ffffff'
                          }
                        />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          }
          footer={
            <CustomizerPurchaseControls
              compact
              canvas={fabricCanvas}
              productSlug={product.slug}
              productName={product.name}
              surfaceId={viewSide}
              previewDataUrl={
                viewSide === 'front' ? frontTextureUrl : backTextureUrl
              }
              onProductColorChange={setShirtColor}
              getEditorState={() => ({
                shirt_color: shirtColor,
                active_surface_id: viewSide,
                surfaces: ['front', 'back'].map(surface => ({
                  id: surface,
                  fabric_json: window.localStorage.getItem(
                    `zazzle:editor:${product.slug}:${surface}`
                  ),
                })),
              })}
            />
          }
        />
      </div>
    </div>
  );
}
