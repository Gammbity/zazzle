import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { fabric } from 'fabric';
import GarmentHeader from './GarmentHeader';
import GarmentSidebar, { GarmentRail, type GarmentTab } from './GarmentSidebar';
import GarmentPurchasePanel from './GarmentPurchasePanel';
import { useFabricHistory } from './FabricEditorControls';
import { garmentHasBack, getGarmentAsset, type GarmentSide, type GarmentType } from './garment-presets';
import './customizer.css';

// Code-split from the rest of the studio shell so only the stage (the
// canvas / "3d model" area) shows a spinner while it loads — the header,
// rail and purchase panel stay mounted and don't flicker.
const GarmentStage = dynamic(() => import('./GarmentStage'), {
  ssr: false,
  loading: () => (
    <div className='garment-stage-column'>
      <div className='garment-stage-frame'>
        <Loader2 className='garment-stage-spinner' size={32} />
      </div>
    </div>
  ),
});

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
  const [shirtColor, setShirtColor] = useState('#ffffff');
  const [viewSide, setViewSide] = useState<GarmentSide>('front');
  const [activeTab, setActiveTab] = useState<GarmentTab>('image');
  const draftKey = `zazzle:editor:${product.slug}:${viewSide}`;
  const history = useFabricHistory(fabricCanvas, draftKey);
  const asset = getGarmentAsset(garment, viewSide);
  const hasBack = garmentHasBack(garment);

  const handleTextureUpdate = () => {
    // Fabric texture is composited on demand (preview/export/add-to-cart),
    // so no intermediate state is needed here.
  };

  const handleViewSideChange = (side: GarmentSide) => {
    if (side === 'back' && !hasBack) return;
    setViewSide(side);
  };

  return (
    <div className='garment-studio'>
      <GarmentHeader
        productName={product.name}
        surfaceLabel={viewSide === 'front' ? 'Old tomoni' : 'Orqa tomoni'}
        canvas={fabricCanvas}
        garmentImage={asset.image}
        printArea={asset.printArea}
        history={history}
      />

      <div className='garment-body'>
        <GarmentRail activeTab={activeTab} onChange={setActiveTab} />

        <GarmentStage
          garment={garment}
          viewSide={viewSide}
          onViewSideChange={handleViewSideChange}
          shirtColor={shirtColor}
          canvas={fabricCanvas}
          onCanvasReady={setFabricCanvas}
          onTextureUpdate={handleTextureUpdate}
          history={history}
        />

        <div className='garment-right-panel'>
          <GarmentSidebar
            canvas={fabricCanvas}
            productLabel={product.name}
            shirtColor={shirtColor}
            onShirtColorChange={setShirtColor}
            activeTab={activeTab}
          />
          <GarmentPurchasePanel
            canvas={fabricCanvas}
            productSlug={product.slug}
            productName={product.name}
            surfaceId={viewSide}
            history={history}
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
        </div>
      </div>
    </div>
  );
}
