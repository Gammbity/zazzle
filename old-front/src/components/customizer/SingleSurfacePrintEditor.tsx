import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import type { SingleSurfaceEditorConfig } from './single-surface-presets';

interface SingleSurfacePrintEditorProps {
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onTextureUpdate: (dataUrl: string) => void;
  config: SingleSurfaceEditorConfig;
}

function applyObjectControls(object: fabric.Object): void {
  object.set({
    hasBorders: true,
    hasControls: true,
    cornerSize: 12,
    borderColor: '#3b82f6',
    cornerColor: '#3b82f6',
    transparentCorners: false,
  });
  object.setCoords();
}

export default function SingleSurfacePrintEditor({
  onCanvasReady,
  onTextureUpdate,
  config,
}: SingleSurfacePrintEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: config.canvasWidth,
      height: config.canvasHeight,
      backgroundColor: 'white',
      preserveObjectStacking: true,
      selectionBorderColor: '#3b82f6',
      selectionLineWidth: 2,
      controlsAboveOverlay: true,
      selection: true,
      skipOffscreen: false,
    });

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

    const exportTexture = (): void => {
      onTextureUpdate(
        canvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1,
        })
      );
    };

    const handleObjectAdded = (event: fabric.IEvent<Event>): void => {
      if (event.target) {
        applyObjectControls(event.target);
        canvas.renderAll();
      }

      exportTexture();
    };

    const handleDeleteKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      const activeObjects = canvas.getActiveObjects();
      if (!activeObjects.length) {
        return;
      }

      const isEditing = activeObjects.some(
        object => (object as fabric.IText).isEditing
      );
      if (isEditing) {
        return;
      }

      event.preventDefault();
      canvas.discardActiveObject();
      activeObjects.forEach(object => canvas.remove(object));
      canvas.requestRenderAll();
      exportTexture();
    };

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', exportTexture);
    canvas.on('object:scaling', exportTexture);
    canvas.on('object:moving', exportTexture);
    canvas.on('object:rotating', exportTexture);
    canvas.on('object:removed', exportTexture);
    canvas.on('selection:cleared', exportTexture);
    window.addEventListener('keydown', handleDeleteKey);

    onCanvasReady(canvas);
    exportTexture();

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:modified', exportTexture);
      canvas.off('object:scaling', exportTexture);
      canvas.off('object:moving', exportTexture);
      canvas.off('object:rotating', exportTexture);
      canvas.off('object:removed', exportTexture);
      canvas.off('selection:cleared', exportTexture);
      window.removeEventListener('keydown', handleDeleteKey);
      canvas.dispose();
    };
  }, [config, onCanvasReady, onTextureUpdate]);

  return (
    <div className='print-editor-sidebar'>
      <div className='canvas-header'>
        <h3 style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
          {config.title}
        </h3>
      </div>

      <div
        className='canvas-wrapper-2d'
        style={{
          position: 'relative',
          maxWidth: '100%',
          border: '2px solid #94a3b8',
          borderRadius: '6px',
          background: '#ffffff',
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div className='handle-legend' style={{ marginTop: '12px' }}>
        <span
          className='handle-legend-dot'
          style={{ backgroundColor: '#94a3b8' }}
        />
        <span>{config.legend}</span>
      </div>
    </div>
  );
}
