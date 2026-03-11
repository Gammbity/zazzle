"use client";

import { useState } from 'react';
import CalendarViewer from './CalendarViewer';
import CalendarPrintEditor from './CalendarPrintEditor';
import CalendarSidebar from './CalendarSidebar';
import { fabric } from 'fabric';
import './customizer.css';

export default function CalendarWrapper() {
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
                <CalendarViewer textureUrl={textureUrl} />

                <div className="print-editor-wrapper">
                    <CalendarPrintEditor
                        onCanvasReady={handleCanvasReady}
                        onTextureUpdate={handleTextureUpdate}
                    />
                </div>
            </div>

            <div className="right-panel-container">
                <CalendarSidebar
                    canvas={fabricCanvas}
                />
            </div>
        </div>
    );
}
