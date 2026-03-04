"use client";

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface PrintEditorProps {
    onCanvasReady: (canvas: fabric.Canvas) => void;
    onTextureUpdate: () => void;
    mugColor?: string;
    width?: number;
    height?: number;
}

// Resolution: 540x200 (2.7:1 ratio for 11oz mugs, height calibrated to 3D)
const CANVAS_W = 540;
const CANVAS_H = 200;

// 11oz mug circumference ≈ 29.5cm → 1cm ≈ 18px
// Safe margin on each side next to the handle seam
const HANDLE_MARGIN_PX = 18;

export default function PrintEditor({ onCanvasReady, onTextureUpdate, mugColor = '#ffffff', width = CANVAS_W, height = CANVAS_H }: PrintEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            // Canvas background = mug body color.
            // 3D material is white, so this background color IS the mug color on the 3D model.
            backgroundColor: mugColor,
            preserveObjectStacking: true,
            // Make selection borders visible
            selectionBorderColor: '#3b82f6',
            selectionLineWidth: 2,
            // Show controls above everything
            controlsAboveOverlay: true,
            centeredScaling: false,
            centeredRotation: false,
            // Enable selection
            selection: true,
            // Do not clip offscreen elements (controls might be offscreen)
            skipOffscreen: false,
            // Standard settings for editing
            enableRetinaScaling: false,
            renderOnAddRemove: true,
        });
        fabricRef.current = canvas;

        // ── Per-object clipping to safe print zone ───────────────────────────
        // We do NOT use canvas.clipPath (that also clips the white background).
        // Instead each added object gets its own clipPath so the canvas background
        // stays fully white while objects are hard-clipped at the guide lines.
        const makeSafeClip = () => new fabric.Rect({
            left: HANDLE_MARGIN_PX,
            top: 0,
            width: width - HANDLE_MARGIN_PX * 2,
            height,
            absolutePositioned: true,
        });

        // Simplified styling - Fabric handles its own structure
        const canvasElement = canvasRef.current;
        if (canvasElement) {
            canvasElement.style.position = 'relative';
        }

        // Configure control handles for 2D editing
        fabric.Object.prototype.set({
            cornerSize: 12, // Visible corners for editing
            transparentCorners: false,
            cornerColor: '#3b82f6',
            cornerStrokeColor: '#ffffff',
            borderColor: '#3b82f6',
            borderScaleFactor: 1,
            hasRotatingPoint: true, // Enable rotation
            rotatingPointOffset: 25,
            // Allow editing in 2D canvas
            lockMovementX: false,
            lockMovementY: false,
            // Enable controls for editing
            hasBorders: true,
            hasControls: true,
            selectable: true,
            evented: true,
        });

        // Single event setup for object configuration
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
                    selectable: true,
                    evented: true,
                });

                // Apply individual clip so this object cannot render
                // outside the safe zone — canvas background stays white.
                obj.clipPath = makeSafeClip();

                obj.setCoords();
                canvas.renderAll();
            }
            onTextureUpdate();
        });

        canvas.on('object:modified', onTextureUpdate);
        canvas.on('object:scaling', onTextureUpdate);
        canvas.on('object:moving', onTextureUpdate);
        canvas.on('object:rotating', onTextureUpdate);
        canvas.on('object:removed', onTextureUpdate);
        canvas.on('selection:cleared', onTextureUpdate);

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
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        onCanvasReady(canvas);

        return () => {
            canvas.off('object:modified', onTextureUpdate);
            canvas.off('object:added');
            canvas.off('object:removed', onTextureUpdate);
            canvas.off('selection:cleared', onTextureUpdate);
            window.removeEventListener('keydown', handleKeyDown);
            canvas.dispose();
        };
    }, []);

    // ── Sync canvas background with mug color ─────────────────────────────
    // When mugColor changes, repaint canvas background so 3D texture reflects it.
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.setBackgroundColor(mugColor, () => {
            canvas.renderAll();
            onTextureUpdate();
        });
    }, [mugColor]);

    return (
        <div className="print-editor-sidebar">
            <div className="canvas-header">
                <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                    Print Hududi (Krujka Aylanasi)
                </h3>
            </div>
            {/* Canvas wrapper with complete isolation for controls */}
            <div
                className="canvas-wrapper-2d"
                style={{
                    overflow: 'visible',
                    maxWidth: '100%',
                    borderRadius: '6px',
                    border: '2px solid #94a3b8',
                    position: 'relative',
                }}
            >
                <canvas ref={canvasRef} />

                {/* ── Handle Safe-Zone Overlays ── */}
                {/* Left margin (handle-side edge) */}
                <div
                    className="handle-zone handle-zone-left"
                    style={{ width: HANDLE_MARGIN_PX }}
                >
                    <span className="handle-zone-label">✋</span>
                </div>
                {/* Right margin (handle-side edge) */}
                <div
                    className="handle-zone handle-zone-right"
                    style={{ width: HANDLE_MARGIN_PX }}
                >
                    <span className="handle-zone-label">✋</span>
                </div>

                {/* Dashed guide lines */}
                <div className="handle-guide handle-guide-left" style={{ left: HANDLE_MARGIN_PX }} />
                <div className="handle-guide handle-guide-right" style={{ right: HANDLE_MARGIN_PX }} />
            </div>

            {/* Legend */}
            <div className="handle-legend">
                <span className="handle-legend-dot" />
                <span>Tutqich yaqinida {HANDLE_MARGIN_PX}px (≈1 sm) bo'sh hudud — rasm shu zonaga tushmasa yaxshi</span>
            </div>
        </div>
    );
}
