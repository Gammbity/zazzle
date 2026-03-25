'use client';

import {
  useRef,
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { Stage, Layer as KonvaLayer, Rect, Text, Line } from 'react-konva';
import type Konva from 'konva';
import type { Layer, ImageLayer, TextLayer, StickerLayer } from '@/types/layer';
import type { PrintArea } from '@/types/product';
import { printAreaToRect } from '@/lib/editor/bounds';
import { exportLayerAsPng } from '@/lib/editor/export';
import ImageLayerNode from './layers/ImageLayerNode';
import TextLayerNode from './layers/TextLayerNode';
import StickerLayerNode from './layers/StickerLayerNode';
import SelectionTransformer from './transformer/SelectionTransformer';

// ---------------------------------------------------------------------------
// Public handle
// ---------------------------------------------------------------------------

export interface DesignCanvasHandle {
  exportPng: (options?: { cropToPrintArea?: boolean }) => string | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DesignCanvasProps {
  layers: Layer[];
  selectedLayerId: string | null;
  /** Percentage-based print area from product config. */
  printArea: PrintArea;
  canvasWidth: number;
  canvasHeight: number;
  onSelectLayer: (id: string | null) => void;
  /** Called during drag/scale – no history entry */
  onChangeLayer: (id: string, attrs: Record<string, unknown>) => void;
  /** Called on drag/transform end – pushes history */
  onCommitLayer: (id: string, attrs: Record<string, unknown>) => void;
  onDoubleClickText?: (id: string) => void;
  onReady?: (handle: DesignCanvasHandle) => void;
}

// ---------------------------------------------------------------------------
// Safe-area guide components (non-exported, render-only)
// ---------------------------------------------------------------------------

function SafeAreaGuides({
  printArea,
  canvasWidth,
  canvasHeight,
}: {
  printArea: PrintArea;
  canvasWidth: number;
  canvasHeight: number;
}) {
  if (!printArea) return null;
  const {
    x,
    y,
    width: w,
    height: h,
  } = printAreaToRect(printArea, canvasWidth, canvasHeight);

  return (
    <>
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        stroke='#0ea5e9'
        strokeWidth={1.5}
        dash={[6, 4]}
        listening={false}
      />
      <Rect
        x={0}
        y={0}
        width={canvasWidth}
        height={y}
        fill='rgba(0,0,0,0.06)'
        listening={false}
      />
      <Rect
        x={0}
        y={y + h}
        width={canvasWidth}
        height={canvasHeight - y - h}
        fill='rgba(0,0,0,0.06)'
        listening={false}
      />
      <Rect
        x={0}
        y={y}
        width={x}
        height={h}
        fill='rgba(0,0,0,0.06)'
        listening={false}
      />
      <Rect
        x={x + w}
        y={y}
        width={canvasWidth - x - w}
        height={h}
        fill='rgba(0,0,0,0.06)'
        listening={false}
      />
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
        stroke='#0ea5e9'
        strokeWidth={0.5}
        dash={[4, 4]}
        listening={false}
        opacity={0.5}
      />
      <Line
        points={[0, canvasHeight / 2, canvasWidth, canvasHeight / 2]}
        stroke='#0ea5e9'
        strokeWidth={0.5}
        dash={[4, 4]}
        listening={false}
        opacity={0.5}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main canvas
// ---------------------------------------------------------------------------

const DesignCanvas = forwardRef<DesignCanvasHandle, DesignCanvasProps>(
  function DesignCanvas(
    {
      layers,
      selectedLayerId,
      printArea,
      canvasWidth,
      canvasHeight,
      onSelectLayer,
      onChangeLayer,
      onCommitLayer,
      onDoubleClickText,
      onReady,
    },
    ref
  ) {
    const stageRef = useRef<Konva.Stage>(null);
    const designLayerRef = useRef<Konva.Layer>(null);
    const guidesLayerRef = useRef<Konva.Layer>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const [showGuides, setShowGuides] = useState(false);

    // Compute pixel rect once per render – passed to child nodes and transformer
    const printAreaRect = useMemo(
      () => printAreaToRect(printArea, canvasWidth, canvasHeight),
      [printArea, canvasWidth, canvasHeight]
    );
    // ── Export handle ────────────────────────────────────────────────────
    //
    // IMPORTANT: export the FULL design layer, not a print-area crop.
    //
    // The mug renderer's designBox (from catalog overlayBox) was calibrated
    // for the full-stage image.  If we export only the print area and draw
    // it at overlayBox.x=18%, the content shifts 3% further left than the
    // calibration expects — pushing left-edge glyphs into the handle shadow.
    //
    // Glyph-edge safety is handled in the renderer by expanding dBoxW/dBoxH
    // (see getPreviewRectFromSurface / applyPreviewPadding), never by
    // cropping the source canvas.
    const handleRef = useRef<DesignCanvasHandle>({
      exportPng(options) {
        return exportLayerAsPng(
          designLayerRef.current!,
          trRef.current,
          2,
          options?.cropToPrintArea ? printAreaRect : undefined
        );
      },
    });
    useImperativeHandle(ref, () => handleRef.current);
    useEffect(() => { onReady?.(handleRef.current); }, []); // eslint-disable-line

    // ── Clear transformer when selection is removed ───────────────────────
    useEffect(() => {
      const tr = trRef.current;
      if (!tr) return;
      if (!selectedLayerId) {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
      }
    }, [selectedLayerId]);

    // ── Stage click → deselect ────────────────────────────────────────────
    const handleStageMouseDown = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (e.target === e.target.getStage()) onSelectLayer(null);
      },
      [onSelectLayer]
    );

    const handleDragStart = useCallback(() => setShowGuides(true), []);
    const handleDragEnd = useCallback(() => setShowGuides(false), []);

    const sorted = useMemo(
      () => [...layers].sort((a, b) => a.zIndex - b.zIndex),
      [layers]
    );

    return (
      <div
        className='overflow-hidden rounded-xl border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,white_0%_50%)] bg-[length:16px_16px]'
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown}
        >
          {/* Guides – non-listening, excluded from export */}
          <KonvaLayer ref={guidesLayerRef} listening={false}>
            <SafeAreaGuides
              printArea={printArea}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
            <CenterGuides
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              show={showGuides}
            />
          </KonvaLayer>

          {/* Design layer – exported as PNG */}
          <KonvaLayer
            ref={designLayerRef}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {sorted.map(layer => {
              if (!layer.visible) return null;
              const id = layer.id;
              const isSelected = selectedLayerId === id;
              const select = () => onSelectLayer(id);
              const change = (attrs: Partial<Layer>) =>
                onChangeLayer(id, attrs as Record<string, unknown>);
              const commit = (attrs: Partial<Layer>) =>
                onCommitLayer(id, attrs as Record<string, unknown>);

              switch (layer.type) {
                case 'image':
                  return (
                    <ImageLayerNode
                      key={id}
                      layer={layer as ImageLayer}
                      isSelected={isSelected}
                      dragBounds={printAreaRect}
                      transformerRef={trRef}
                      onSelect={select}
                      onChange={change}
                      onCommit={commit}
                    />
                  );
                case 'text':
                  return (
                    <TextLayerNode
                      key={id}
                      layer={layer as TextLayer}
                      isSelected={isSelected}
                      dragBounds={printAreaRect}
                      transformerRef={trRef}
                      onSelect={select}
                      onChange={change}
                      onCommit={commit}
                      onDoubleClick={() => onDoubleClickText?.(id)}
                    />
                  );
                case 'sticker':
                  return (
                    <StickerLayerNode
                      key={id}
                      layer={layer as StickerLayer}
                      isSelected={isSelected}
                      dragBounds={printAreaRect}
                      transformerRef={trRef}
                      onSelect={select}
                      onChange={change}
                      onCommit={commit}
                    />
                  );
                default:
                  return null;
              }
            })}

            <SelectionTransformer ref={trRef} printAreaRect={printAreaRect} />
          </KonvaLayer>
        </Stage>
      </div>
    );
  }
);

export default DesignCanvas;
