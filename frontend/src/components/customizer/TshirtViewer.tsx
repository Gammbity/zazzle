import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface TshirtViewerProps {
  textureUrl: string;
  shirtColor: string;
  viewSide: 'front' | 'back';
}

export default function TshirtViewer({
  textureUrl,
  shirtColor,
  viewSide,
}: TshirtViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = () => {
    if (!containerRef.current) return;
    alert('Futbolka eksportida yakuniy birlashtirilgan rasm tayyorlanadi.');
  };

  const imageSrc =
    viewSide === 'front'
      ? '/products/t-shirt/front.jpg'
      : '/products/t-shirt/back.jpg';

  return (
    <div
      className='canvas-wrapper'
      style={{
        position: 'relative',
        backgroundColor: '#cbd5e1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
      ref={containerRef}
    >
      <button
        className='action-btn primary'
        onClick={handleExport}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          width: 'auto',
        }}
      >
        <Camera size={18} /> Eksport
      </button>

      <div
        style={{
          position: 'relative',
          height: '90%',
          maxHeight: '600px',
          aspectRatio: '3/4',
        }}
      >
        <img
          src={imageSrc}
          alt={`Futbolka ${viewSide === 'front' ? 'oldi' : 'orqasi'}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: shirtColor,
            mixBlendMode: 'multiply',
          }}
        />

        {textureUrl && (
          <img
            src={textureUrl}
            alt='Dizayn bosma qatlami'
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '56%', // Increased from 35% to 56% to approach the sleeves edge-to-edge
              height: 'auto',
              aspectRatio: '400/460', // Matching the new canvas ratio
              objectFit: 'contain',
              mixBlendMode: 'normal',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.2) dashed',
            }}
          />
        )}
      </div>
    </div>
  );
}
