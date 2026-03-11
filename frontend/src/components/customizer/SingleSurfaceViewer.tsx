'use client';

import { useRef } from 'react';
import { Camera } from 'lucide-react';
import type { SingleSurfaceViewerConfig } from './single-surface-presets';

interface SingleSurfaceViewerProps {
  textureUrl: string;
  config: SingleSurfaceViewerConfig;
}

export default function SingleSurfaceViewer({
  textureUrl,
  config,
}: SingleSurfaceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = (): void => {
    if (!containerRef.current) {
      return;
    }

    window.alert(config.exportMessage);
  };

  return (
    <div
      ref={containerRef}
      className='canvas-wrapper'
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: '#cbd5e1',
      }}
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

      <div style={config.stageStyle}>
        <img
          src={config.productImageSrc}
          alt={config.productImageAlt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: '#ffffff',
          }}
        />

        {textureUrl ? (
          <img
            src={textureUrl}
            alt='Design print overlay'
            style={{
              position: 'absolute',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
              boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1) dashed',
              ...config.overlayStyle,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
