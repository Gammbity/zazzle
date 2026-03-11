"use client";

import { useState } from 'react';
import BusinessCardViewer from './BusinessCardViewer';
import BusinessCardPrintEditor from './BusinessCardPrintEditor';
import BusinessCardSidebar from './BusinessCardSidebar';
import { fabric } from 'fabric';
import './customizer.css';

export default function BusinessCardWrapper() {
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
    const [textureUrl, setTextureUrl] = useState<string>('');

    const handleCanvasReady = (canvas: fabric.Canvas) => {
        setFabricCanvas(canvas);
    };

    const handleTextureUpdate = (url: string) => {
        setTextureUrl(url);
    };

    return (
        <div className="app-container">
            <div className="left-panel">
                <BusinessCardViewer textureUrl={textureUrl} />

                <div className="print-editor-wrapper">
                    <BusinessCardPrintEditor
                        onCanvasReady={handleCanvasReady}
                        onTextureUpdate={handleTextureUpdate}
                    />
                </div>
            </div>

            <div className="right-panel-container">
                <BusinessCardSidebar
                    canvas={fabricCanvas}
                />
            </div>
        </div>
    );
}
