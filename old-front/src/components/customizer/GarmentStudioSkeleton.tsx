import {
  ChevronLeft,
  Download,
  Eye,
  Image as ImageIcon,
  Loader2,
  Package,
  Redo2,
  Shirt,
  Smile,
  Type,
  Undo2,
} from 'lucide-react';
import './customizer.css';

// Mirrors the real garment studio DOM (header / rail / stage / right panel)
// so the outer dynamic-import fallback doesn't cause the whole page to
// flash — only the stage area shows a spinner while the editor chunk loads.
export default function GarmentStudioSkeleton() {
  return (
    <div className='garment-studio' aria-busy='true' aria-live='polite'>
      <header className='garment-header'>
        <span className='garment-header-back'>
          <ChevronLeft size={18} /> Mahsulotlar
        </span>

        <div className='garment-header-title'>
          <span className='garment-header-icon'>
            <Shirt size={16} />
          </span>
        </div>

        <div className='garment-header-actions'>
          <span className='garment-icon-btn'>
            <Undo2 size={17} />
          </span>
          <span className='garment-icon-btn'>
            <Redo2 size={17} />
          </span>
          <span className='garment-btn'>
            <Eye size={16} /> Preview
          </span>
          <span className='garment-btn primary'>
            <Download size={16} /> Eksport
          </span>
        </div>
      </header>

      <div className='garment-body'>
        <div className='garment-rail'>
          <span className='garment-rail-btn active'>
            <ImageIcon size={18} />
            Rasm
          </span>
          <span className='garment-rail-btn'>
            <Type size={18} />
            Matn
          </span>
          <span className='garment-rail-btn'>
            <Smile size={18} />
            Emoji
          </span>
          <span className='garment-rail-btn'>
            <Package size={18} />
            Mahsulot
          </span>
        </div>

        <div className='garment-stage-column'>
          <div className='garment-stage-frame'>
            <Loader2 className='garment-stage-spinner' size={32} />
          </div>
        </div>

        <div className='garment-right-panel'>
          <div className='garment-panel-section'>
            <div
              className='garment-skeleton-bar'
              style={{ width: '55%', marginBottom: 10 }}
            />
            <div className='garment-skeleton-bar' style={{ width: '100%' }} />
          </div>
          <div className='garment-panel-section'>
            <div
              className='garment-skeleton-bar'
              style={{ width: '40%', marginBottom: 10 }}
            />
            <div
              className='garment-skeleton-bar'
              style={{ width: '100%', height: 40 }}
            />
          </div>
          <div
            className='garment-skeleton-bar'
            style={{ width: '100%', height: 44, borderRadius: 999 }}
          />
        </div>
      </div>
    </div>
  );
}
