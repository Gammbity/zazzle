'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface TshirtPrintEditorProps {
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onTextureUpdate: (dataUrl: string, side: 'front' | 'back') => void;
  viewSide: 'front' | 'back';
}

// Expanded resolution for T-shirt to reach edge-to-edge
const CANVAS_W = 400;
const CANVAS_H = 460;

export default function TshirtPrintEditor({
  onCanvasReady,
  onTextureUpdate,
  viewSide,
}: TshirtPrintEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  // Store JSON states for front and back designs
  const savedState = useRef<Record<string, any>>({ front: null, back: null });
  const prevViewSide = useRef(viewSide);

  const exportTexture = (canvas: fabric.Canvas, side: 'front' | 'back') => {
    const url = canvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1,
    });
    onTextureUpdate(url, side);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: 'transparent',
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

    const updateAndExport = () => {
      if (fabricRef.current) {
        exportTexture(fabricRef.current, prevViewSide.current);
      }
    };

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
      if (e.key === 'Delete' || e.key === 'Backspace') {
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

    return () => {
      canvas.off('object:modified', updateAndExport);
      canvas.off('object:added');
      canvas.off('object:removed', updateAndExport);
      canvas.off('selection:cleared', updateAndExport);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, []);

  // Handle viewSide changes: save current state, load new state
  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas && prevViewSide.current !== viewSide) {
      // Save current state
      savedState.current[prevViewSide.current] = canvas.toJSON();

      // Prepare to load new state
      const newState = savedState.current[viewSide];
      const upcomingSide = viewSide;
      prevViewSide.current = viewSide;

      if (newState) {
        canvas.loadFromJSON(newState, () => {
          canvas.renderAll();
          exportTexture(canvas, upcomingSide);
        });
      } else {
        canvas.clear();
        canvas.setBackgroundColor('transparent', () => {
          canvas.renderAll();
          exportTexture(canvas, upcomingSide);
        });
      }

      // Re-assign canvas reference to external components (like sidebar)
      onCanvasReady(canvas);
    }
  }, [viewSide]);

  return (
    <div className='print-editor-sidebar'>
      <div className='canvas-header'>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
          Bosma hududi ({viewSide === 'front' ? 'Oldi' : 'Orqa'})
        </h3>
      </div>

      <div
        className='canvas-wrapper-2d'
        style={{
          maxWidth: '100%',
          borderRadius: '6px',
          border: '2px solid #94a3b8',
          position: 'relative',
          background:
            'repeating-conic-gradient(#f1f5f9 0% 25%, white 0% 50%) 50% / 20px 20px',
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div className='handle-legend' style={{ marginTop: '12px' }}>
        <span
          className='handle-legend-dot'
          style={{ backgroundColor: '#94a3b8' }}
        />
        <span>
          Kengaytirilgan maydon: Endi dizayn yengingizgacha yetib borishi
          mumkin.
        </span>
      </div>
    </div>
  );
}
