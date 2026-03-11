"use client";

import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface BusinessCardViewerProps {
    textureUrl: string;
}

export default function BusinessCardViewer({ textureUrl }: BusinessCardViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleExport = () => {
        if (!containerRef.current) return;
        alert('Business Card export functionality will render the composite image.');
    };

    const imageSrc = '/products/business-card/front.jpg';

    return (
        <div
            className="canvas-wrapper"
            style={{
                position: 'relative',
                backgroundColor: '#cbd5e1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
            }}
            ref={containerRef}
        >
            <button
                className="action-btn primary"
                onClick={handleExport}
                style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, width: 'auto' }}
            >
                <Camera size={18} /> Eksport
            </button>

            <div style={{ position: 'relative', width: '90%', maxWidth: '800px', aspectRatio: '16/9' }}>
                <img
                    src={imageSrc}
                    alt="Business Card"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#ffffff',
                    }}
                />

                {textureUrl && (
                    <img
                        src={textureUrl}
                        alt="Design print overlay"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '45%', // Heuristic size, adjust depending on the exact front.jpg scaling
                            height: 'auto',
                            aspectRatio: '630/360',
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1) dashed',
                            borderRadius: '2px'
                        }}
                    />
                )}
            </div>
        </div>
    );
}
