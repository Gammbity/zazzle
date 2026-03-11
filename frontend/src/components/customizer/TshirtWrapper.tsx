"use client";

import { useState } from 'react';
import TshirtViewer from './TshirtViewer';
import TshirtPrintEditor from './TshirtPrintEditor';
import TshirtSidebar from './TshirtSidebar';
import { fabric } from 'fabric';
import './customizer.css';

export default function TshirtWrapper() {
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
    const [frontTextureUrl, setFrontTextureUrl] = useState<string>('');
    const [backTextureUrl, setBackTextureUrl] = useState<string>('');
    const [shirtColor, setShirtColor] = useState('#ffffff');
    const [viewSide, setViewSide] = useState<'front' | 'back'>('front');

    const handleCanvasReady = (canvas: fabric.Canvas) => {
        setFabricCanvas(canvas);
    };

    const handleTextureUpdate = (url: string, side: 'front' | 'back') => {
        if (side === 'front') {
            setFrontTextureUrl(url);
        } else {
            setBackTextureUrl(url);
        }
    };

    return (
        <div className="app-container">
            <div className="left-panel">
                <TshirtViewer
                    textureUrl={viewSide === 'front' ? frontTextureUrl : backTextureUrl}
                    shirtColor={shirtColor}
                    viewSide={viewSide}
                />

                <div className="print-editor-wrapper">
                    <TshirtPrintEditor
                        onCanvasReady={handleCanvasReady}
                        onTextureUpdate={handleTextureUpdate}
                        viewSide={viewSide}
                    />
                </div>
            </div>

            <div className="right-panel-container">
                <TshirtSidebar
                    canvas={fabricCanvas}
                    shirtColor={shirtColor}
                    setShirtColor={setShirtColor}
                    viewSide={viewSide}
                    setViewSide={setViewSide}
                />
            </div>
        </div>
    );
}
