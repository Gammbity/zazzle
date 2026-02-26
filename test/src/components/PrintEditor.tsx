import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface PrintEditorProps {
    onCanvasReady: (canvas: fabric.Canvas) => void;
    onTextureUpdate: () => void;
    /**
     * Width of the canvas in pixels — should represent the full printable wrap circumference
     * (i.e. circumference of the mug body minus the handle gap).
     * Height should equal the printable height of the mug body.
     */
    width?: number;
    height?: number;
}

// Professional Mug Print Dimensions
// Resolution: 1500x550 (approx 2.7:1 ratio for 11oz mugs, height calibrated to 3D)
const CANVAS_W = 1500;
const CANVAS_H = 550;
const PADDING_V = 10; // 5px top + 5px bottom (at this resolution)

export default function PrintEditor({ onCanvasReady, onTextureUpdate, width = CANVAS_W, height = CANVAS_H }: PrintEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            // Clip everything to the canvas boundary
            clipPath: new fabric.Rect({
                left: 0,
                top: 0,
                width,
                height,
                absolutePositioned: true,
            }),
        });
        fabricRef.current = canvas;

        // Add padding guides (non-selectable)
        const guideStyle = {
            stroke: '#cbd5e1',
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
        };
        canvas.add(new fabric.Line([0, PADDING_V, width, PADDING_V], guideStyle));
        canvas.add(new fabric.Line([0, height - PADDING_V, width, height - PADDING_V], guideStyle));

        canvas.on('object:modified', onTextureUpdate);
        canvas.on('object:added', onTextureUpdate);
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
            canvas.off('object:added', onTextureUpdate);
            canvas.off('object:removed', onTextureUpdate);
            canvas.off('selection:cleared', onTextureUpdate);
            window.removeEventListener('keydown', handleKeyDown);
            canvas.dispose();
        };
    }, []);

    return (
        <div className="print-editor-sidebar">
            <div className="canvas-header">
                <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                    Print Hududi (Krujka Aylanasi) — Bo'yi va Eni Krujkaga Moslangan
                </h3>
            </div>
            {/* overflow hidden ensures visual clip even where fabric might render outside */}
            <div
                className="canvas-wrapper-2d"
                style={{ overflow: 'hidden', maxWidth: '100%', borderRadius: '6px', border: '2px dashed #94a3b8' }}
            >
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}
