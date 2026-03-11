"use client";

import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface CalendarViewerProps {
    textureUrl: string;
}

export default function CalendarViewer({ textureUrl }: CalendarViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleExport = () => {
        if (!containerRef.current) return;
        alert('Desk Calendar export functionality will render the composite image.');
    };

    const imageSrc = '/products/desk-calendar/front.jpg';

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

            <div style={{ position: 'relative', height: '90%', maxHeight: '600px', aspectRatio: '4/3' }}>
                <img
                    src={imageSrc}
                    alt="Desk Calendar"
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
                            top: '30%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '65%', // Adjust based on the actual desk-calendar front.jpg
                            height: 'auto',
                            aspectRatio: '560/400',
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1) dashed',
                            borderRadius: '4px'
                        }}
                    />
                )}
            </div>
        </div>
    );
}
