import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fabric } from 'fabric';
import { ChevronLeft, Download, Eye, Redo2, Shirt, Undo2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { composeGarmentPreview } from './composeGarmentPreview';
import type { GarmentPrintArea } from './garment-presets';
import type { useFabricHistory } from './FabricEditorControls';

interface GarmentHeaderProps {
  productName: string;
  surfaceLabel: string;
  canvas: fabric.Canvas | null;
  garmentImage: string;
  printArea: GarmentPrintArea;
  history: ReturnType<typeof useFabricHistory>;
}

export default function GarmentHeader({
  productName,
  surfaceLabel,
  canvas,
  garmentImage,
  printArea,
  history,
}: GarmentHeaderProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState<'preview' | 'export' | null>(null);

  const composeCurrent = async () => {
    if (!canvas) return null;
    const designDataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    return composeGarmentPreview(garmentImage, designDataUrl, printArea);
  };

  const handlePreview = async () => {
    setBusy('preview');
    try {
      const flattened = await composeCurrent();
      if (flattened) {
        setPreviewUrl(flattened);
        setPreviewOpen(true);
      }
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      const flattened = await composeCurrent();
      if (flattened) {
        const link = document.createElement('a');
        link.download = 'dizayn-eksport.png';
        link.href = flattened;
        link.click();
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <header className='garment-header'>
        <button
          type='button'
          className='garment-header-back'
          onClick={() => router.back()}
        >
          <ChevronLeft size={18} /> Mahsulotlar
        </button>

        <div className='garment-header-title'>
          <span className='garment-header-icon'>
            <Shirt size={16} />
          </span>
          <div>
            <p className='garment-header-name'>{productName}</p>
            <p className='garment-header-surface'>{surfaceLabel}</p>
          </div>
        </div>

        <div className='garment-header-actions'>
          <button
            type='button'
            className='garment-icon-btn'
            disabled={!history.canUndo}
            onClick={history.undo}
            aria-label='Ortga qaytarish'
            title='Ortga qaytarish'
          >
            <Undo2 size={17} />
          </button>
          <button
            type='button'
            className='garment-icon-btn'
            disabled={!history.canRedo}
            onClick={history.redo}
            aria-label='Qaytadan bajarish'
            title='Qaytadan bajarish'
          >
            <Redo2 size={17} />
          </button>

          <button
            type='button'
            className='garment-btn'
            onClick={() => void handlePreview()}
            disabled={busy === 'preview'}
          >
            <Eye size={16} /> Preview
          </button>
          <button
            type='button'
            className='garment-btn primary'
            onClick={() => void handleExport()}
            disabled={busy === 'export'}
          >
            <Download size={16} /> Eksport
          </button>
        </div>
      </header>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Dizayn ko'rinishi"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt='Dizayn preview'
            className='w-full rounded-xl border border-slate-200'
          />
        ) : null}
      </Modal>
    </>
  );
}
