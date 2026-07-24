import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

type EditableFabricObject = fabric.Object & { isEditing?: boolean };

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
  const activeSideRef = useRef(viewSide);

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
        exportTexture(fabricRef.current, activeSideRef.current);
      }
    };

    // Keep objects fully inside the print area - dragging stops at the edge,
    // and scaling can never grow the object past the canvas in either axis.
    const constrainToCanvas = (e: fabric.IEvent) => {
      const obj = e.target;
      if (!obj) return;

      const bound = obj.getBoundingRect(true, true);
      if (bound.width > CANVAS_W) {
        obj.scaleX = (obj.scaleX ?? 1) * (CANVAS_W / bound.width);
      }
      if (bound.height > CANVAS_H) {
        obj.scaleY = (obj.scaleY ?? 1) * (CANVAS_H / bound.height);
      }
      obj.setCoords();

      const clamped = obj.getBoundingRect(true, true);
      let dx = 0;
      let dy = 0;
      if (clamped.left < 0) {
        dx = -clamped.left;
      } else if (clamped.left + clamped.width > CANVAS_W) {
        dx = CANVAS_W - (clamped.left + clamped.width);
      }
      if (clamped.top < 0) {
        dy = -clamped.top;
      } else if (clamped.top + clamped.height > CANVAS_H) {
        dy = CANVAS_H - (clamped.top + clamped.height);
      }
      if (dx || dy) {
        obj.left = (obj.left ?? 0) + dx;
        obj.top = (obj.top ?? 0) + dy;
        obj.setCoords();
      }
    };
    canvas.on('object:moving', constrainToCanvas);
    canvas.on('object:scaling', constrainToCanvas);

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
          const isEditing = active.some(
            obj => (obj as EditableFabricObject).isEditing
          );
          if (!isEditing) {
            e.preventDefault();
            canvas.discardActiveObject();
            canvas.remove(...active);
            canvas.requestRenderAll();
            updateAndExport();
          }
        }
      } else if (e.key === 'Escape' && canvas.getActiveObject()) {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
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

  // FabricEditorControls restores an independent draft for each side.
  useEffect(() => {
    const canvas = fabricRef.current;
    activeSideRef.current = viewSide;
    if (canvas) {
      onCanvasReady(canvas);
    }
  }, [viewSide]);

  return (
    <div className='garment-fabric-canvas-host'>
      <canvas ref={canvasRef} />
    </div>
  );
}
