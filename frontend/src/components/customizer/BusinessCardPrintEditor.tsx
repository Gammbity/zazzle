"use client";

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface BusinessCardPrintEditorProps {
    onCanvasReady: (canvas: fabric.Canvas) => void;
    onTextureUpdate: (dataUrl: string) => void;
}

const CANVAS_W = 630;
const CANVAS_H = 360;

export default function BusinessCardPrintEditor({ onCanvasReady, onTextureUpdate }: BusinessCardPrintEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);

    const exportTexture = (canvas: fabric.Canvas) => {
        const url = canvas.toDataURL({ format: 'png', quality: 1.0, multiplier: 1 });
        onTextureUpdate(url);
    };

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundColor: 'white',
            preserveObjectStacking: true,
            selectionBorderColor: '#3b82f6',
            selectionLineWidth: 2,
            controlsAboveOverlay: true,
            selection: true,
            skipOffscreen: false,
        });
        fabricRef.current = canvas;

        fabric.Object.prototype.set({
            cornerSize: 12,
            transparentCorners: false,
            cornerColor: '#3b82f6',
            cornerStrokeColor: '#ffffff',
            borderColor: '#3b82f6',
            borderScaleFactor: 1,
            hasRotatingPoint: true,
            rotatingPointOffset: 25,
        });

        const updateAndExport = () => exportTexture(canvas);

        canvas.on('object:added', function (e) {
            const obj = e.target;
            if (obj) {
                obj.set({
                    hasBorders: true,
                    hasControls: true,
                    cornerSize: 12,
                    borderColor: '#3b82f6',
                    cornerColor: '#3b82f6',
                    transparentCorners: false,
                });
                obj.setCoords();
                canvas.renderAll();
            }
            updateAndExport();
        });

        canvas.on('object:modified', updateAndExport);
        canvas.on('object:scaling', updateAndExport);
        canvas.on('object:moving', updateAndExport);
        canvas.on('object:rotating', updateAndExport);
        canvas.on('object:removed', updateAndExport);
        canvas.on('selection:cleared', updateAndExport);

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace')) {
                const active = canvas.getActiveObjects();
                if (active.length) {
                    const isEditing = active.some(obj => (obj as any).isEditing);
                    if (!isEditing) {
                        e.preventDefault();
                        canvas.discardActiveObject();
                        active.forEach(obj => canvas.remove(obj));
                        canvas.requestRenderAll();
                        updateAndExport();
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        onCanvasReady(canvas);
        updateAndExport(); // Initial blank export

        return () => {
            canvas.off('object:modified', updateAndExport);
            canvas.off('object:added');
            canvas.off('object:removed', updateAndExport);
            canvas.off('selection:cleared', updateAndExport);
            window.removeEventListener('keydown', handleKeyDown);
            canvas.dispose();
        };
    }, []);

    return (
        <div className="print-editor-sidebar">
            <div className="canvas-header">
                <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                    Print Hududi (Tashrif Qog'ozi)
                </h3>
            </div>

            <div
                className="canvas-wrapper-2d"
                style={{
                    maxWidth: '100%',
                    borderRadius: '6px',
                    border: '2px solid #94a3b8',
                    position: 'relative',
                    background: '#ffffff'
                }}
            >
                <canvas ref={canvasRef} />
            </div>

            <div className="handle-legend" style={{ marginTop: '12px' }}>
                <span className="handle-legend-dot" style={{ backgroundColor: '#94a3b8' }} />
                <span>Sahifa maydoni: 630x360 px (3.5" x 2" nisbatda)</span>
            </div>
        </div>
    );
}
