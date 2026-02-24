'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Stage, Layer as KonvaLayer, Rect, Text, Image as KonvaImage, Transformer, Line } from 'react-konva';
import type Konva from 'konva';
import type { Layer, TextLayer, ImageLayer, StickerLayer } from '@/lib/editor/types';
import type { PrintableArea } from '@/lib/products/catalog';

// ---------------------------------------------------------------------------
// Public handle
// ---------------------------------------------------------------------------

export interface DesignCanvasHandle {
  /** Export ONLY the design layer as a transparent‑background PNG data‑URL. */
  exportPng: () => string | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DesignCanvasProps {
  layers: Layer[];
  selectedLayerId: string | null;
  printableArea: PrintableArea;
  canvasWidth: number;
  canvasHeight: number;
  onSelectLayer: (id: string | null) => void;
  onTransformLayer: (id: string, attrs: Record<string, unknown>) => void;
  onDoubleClickText?: (id: string) => void;
  /** Called once on mount with the imperative handle. */
  onReady?: (handle: DesignCanvasHandle) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useImage(src: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) { setImage(null); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  return image;
}

// ---------------------------------------------------------------------------
// Layer node renderers — selection via onMouseDown for instant feedback
// ---------------------------------------------------------------------------

function ImageLayerNode({
  layer,
  onSelect,
  onTransform,
}: {
  layer: ImageLayer;
  onSelect: () => void;
  onTransform: (attrs: Partial<Layer>) => void;
}) {
  const shapeRef = useRef<Konva.Image>(null);
  const image = useImage(layer.src);

  if (!image) return null;

  return (
    <KonvaImage
      ref={shapeRef}
      name={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable
      perfectDrawEnabled={false}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragEnd={(e) => {
        onTransform({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        onTransform({
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

function TextLayerNode({
  layer,
  onSelect,
  onTransform,
  onDoubleClick,
}: {
  layer: TextLayer;
  onSelect: () => void;
  onTransform: (attrs: Partial<Layer>) => void;
  onDoubleClick?: () => void;
}) {
  const shapeRef = useRef<Konva.Text>(null);

  return (
    <Text
      ref={shapeRef}
      name={layer.id}
      text={layer.text}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      fontSize={layer.fontSize}
      fontFamily={layer.fontFamily}
      fontStyle={layer.fontStyle || 'normal'}
      fill={layer.fill}
      align={layer.align}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable
      hitStrokeWidth={6}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDblClick={() => onDoubleClick?.()}
      onDblTap={() => onDoubleClick?.()}
      onDragEnd={(e) => {
        onTransform({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onTransform({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * sx),
          fontSize: Math.max(8, layer.fontSize * sy),
          scaleX: 1,
          scaleY: 1,
          rotation: node.rotation(),
        });
      }}
    />
  );
}

function StickerLayerNode({
  layer,
  onSelect,
  onTransform,
}: {
  layer: StickerLayer;
  onSelect: () => void;
  onTransform: (attrs: Partial<Layer>) => void;
}) {
  const shapeRef = useRef<Konva.Image>(null);
  const image = useImage(layer.src);

  if (!image) return null;

  return (
    <KonvaImage
      ref={shapeRef}
      name={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable
      perfectDrawEnabled={false}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragEnd={(e) => {
        onTransform({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        onTransform({
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Safe‑area guides  — rendered in a SEPARATE non‑export layer
// ---------------------------------------------------------------------------

function SafeAreaGuides({
  printableArea,
  canvasWidth,
  canvasHeight,
}: {
  printableArea: PrintableArea;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const x = (printableArea.x / 100) * canvasWidth;
  const y = (printableArea.y / 100) * canvasHeight;
  const w = (printableArea.width / 100) * canvasWidth;
  const h = (printableArea.height / 100) * canvasHeight;

  return (
    <>
      <Rect x={x} y={y} width={w} height={h}
        stroke="#0ea5e9" strokeWidth={1.5} dash={[6, 4]} listening={false} />
      <Rect x={0} y={0} width={canvasWidth} height={y}
        fill="rgba(0,0,0,0.06)" listening={false} />
      <Rect x={0} y={y + h} width={canvasWidth} height={canvasHeight - y - h}
        fill="rgba(0,0,0,0.06)" listening={false} />
      <Rect x={0} y={y} width={x} height={h}
        fill="rgba(0,0,0,0.06)" listening={false} />
      <Rect x={x + w} y={y} width={canvasWidth - x - w} height={h}
        fill="rgba(0,0,0,0.06)" listening={false} />
    </>
  );
}

function CenterGuides({
  canvasWidth,
  canvasHeight,
  show,
}: {
  canvasWidth: number;
  canvasHeight: number;
  show: boolean;
}) {
  if (!show) return null;
  return (
    <>
      <Line
        points={[canvasWidth / 2, 0, canvasWidth / 2, canvasHeight]}
        stroke="#0ea5e9" strokeWidth={0.5} dash={[4, 4]} listening={false} opacity={0.5}
      />
      <Line
        points={[0, canvasHeight / 2, canvasWidth, canvasHeight / 2]}
        stroke="#0ea5e9" strokeWidth={0.5} dash={[4, 4]} listening={false} opacity={0.5}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Canvas component
// ---------------------------------------------------------------------------

const DesignCanvas = forwardRef<DesignCanvasHandle, DesignCanvasProps>(
  function DesignCanvas(
    {
      layers,
      selectedLayerId,
      printableArea,
      canvasWidth,
      canvasHeight,
      onSelectLayer,
      onTransformLayer,
      onDoubleClickText,
      onReady,
    },
    ref,
  ) {
    const stageRef = useRef<Konva.Stage>(null);
    const designLayerRef = useRef<Konva.Layer>(null);
    const guidesLayerRef = useRef<Konva.Layer>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const [showGuides, setShowGuides] = useState(false);

    // -------------------------------------------------------------------
    // Export: design layer only (guides hidden, transformer hidden)
    // -------------------------------------------------------------------

    const handleRef = useRef<DesignCanvasHandle>({
      exportPng() {
        const designLayer = designLayerRef.current;
        if (!designLayer) return null;

        // Temporarily hide the transformer so it's excluded from export
        const tr = trRef.current;
        tr?.visible(false);
        designLayer.batchDraw();

        const url = designLayer.toDataURL({ pixelRatio: 2 });

        tr?.visible(true);
        designLayer.batchDraw();

        return url;
      },
    });

    useImperativeHandle(ref, () => handleRef.current);

    useEffect(() => {
      onReady?.(handleRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -------------------------------------------------------------------
    // Persistent Transformer — update nodes when selection changes
    // -------------------------------------------------------------------

    useEffect(() => {
      const tr = trRef.current;
      const designLayer = designLayerRef.current;
      if (!tr || !designLayer) return;

      if (!selectedLayerId) {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
        return;
      }

      // Find the Konva node by the `name` prop which equals layer.id
      const node = designLayer.findOne(`.${selectedLayerId}`);
      if (node) {
        tr.nodes([node as Konva.Node]);
        tr.getLayer()?.batchDraw();
      } else {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
      }
    }, [selectedLayerId, layers]); // re-run when layers change too

    // -------------------------------------------------------------------
    // Stage events — mousedown for instant deselect
    // -------------------------------------------------------------------

    const handleStageMouseDown = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (e.target === e.target.getStage()) {
          onSelectLayer(null);
        }
      },
      [onSelectLayer],
    );

    const handleDragStart = useCallback(() => setShowGuides(true), []);
    const handleDragEnd = useCallback(() => setShowGuides(false), []);

    const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    return (
      <div
        className="border border-gray-200 rounded-xl overflow-hidden bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:16px_16px]"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown}
        >
          {/* ── Guides Layer: non‑listening, hidden during export ── */}
          <KonvaLayer ref={guidesLayerRef} listening={false}>
            <SafeAreaGuides
              printableArea={printableArea}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
            <CenterGuides
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              show={showGuides}
            />
          </KonvaLayer>

          {/* ── Design Layer: exported as PNG ── */}
          <KonvaLayer
            ref={designLayerRef}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {sorted.map((layer) => {
              if (!layer.visible) return null;
              const handleTransform = (attrs: Partial<Layer>) =>
                onTransformLayer(layer.id, attrs);
              const handleSelect = () => onSelectLayer(layer.id);

              switch (layer.type) {
                case 'image':
                  return (
                    <ImageLayerNode
                      key={layer.id}
                      layer={layer as ImageLayer}
                      onSelect={handleSelect}
                      onTransform={handleTransform}
                    />
                  );
                case 'text':
                  return (
                    <TextLayerNode
                      key={layer.id}
                      layer={layer as TextLayer}
                      onSelect={handleSelect}
                      onTransform={handleTransform}
                      onDoubleClick={() => onDoubleClickText?.(layer.id)}
                    />
                  );
                case 'sticker':
                  return (
                    <StickerLayerNode
                      key={layer.id}
                      layer={layer as StickerLayer}
                      onSelect={handleSelect}
                      onTransform={handleTransform}
                    />
                  );
                default:
                  return null;
              }
            })}

            {/* Single persistent Transformer — always mounted, nodes updated via effect */}
            <Transformer
              ref={trRef}
              rotateEnabled
              enabledAnchors={[
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
                'middle-left',
                'middle-right',
              ]}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
              }
              ignoreStroke
              padding={4}
            />
          </KonvaLayer>
        </Stage>
      </div>
    );
  },
);

export default DesignCanvas;
