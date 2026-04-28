import { useRef, useEffect, useState, useCallback } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { ImageLayer } from '@/types/layer';
import type { Rect } from '@/lib/editor/bounds';
import { clampPosition } from '@/lib/editor/bounds';

interface ImageLayerNodeProps {
  layer: ImageLayer;
  isSelected: boolean;
  dragBounds: Rect;
  transformerRef: React.RefObject<Konva.Transformer>;
  onSelect: () => void;
  /** Called live during drag/scale – does NOT push history */
  onChange: (attrs: Partial<ImageLayer>) => void;
  /** Called on drag/transform end – pushes history */
  onCommit: (attrs: Partial<ImageLayer>) => void;
}

/** Load an image element from a src URL. Returns null while loading. */
function useImage(src: string | undefined): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return image;
}

function constrainImageNode(node: Konva.Image, bounds: Rect): void {
  const width = node.width();
  const height = node.height();

  if (!width || !height) {
    return;
  }

  const scaleX = Math.min(Math.abs(node.scaleX()), bounds.width / width);
  const scaleY = Math.min(Math.abs(node.scaleY()), bounds.height / height);
  const nextScaleX = Math.max(0.01, scaleX);
  const nextScaleY = Math.max(0.01, scaleY);

  node.scaleX(nextScaleX);
  node.scaleY(nextScaleY);

  const position = clampPosition(
    { x: node.x(), y: node.y() },
    width * nextScaleX,
    height * nextScaleY,
    bounds
  );

  node.position(position);
}

export default function ImageLayerNode({
  layer,
  isSelected,
  dragBounds,
  transformerRef,
  onSelect,
  onChange,
  onCommit,
}: ImageLayerNodeProps) {
  const shapeRef = useRef<Konva.Image>(null);
  const image = useImage(layer.src);

  const readNodeAttrs = useCallback(
    (node: Konva.Image): Partial<ImageLayer> => {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      return {
        x: node.x(),
        y: node.y(),
        width: node.width(),
        height: node.height(),
        scaleX,
        scaleY,
        rotation: node.rotation(),
      };
    },
    []
  );

  // Attach transformer only after the image element has loaded
  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current && image) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, image, transformerRef, layer.id, layer.width, layer.height]);

  const handleDragBound = useCallback(
    (pos: { x: number; y: number }) =>
      clampPosition(
        pos,
        layer.width * Math.abs(layer.scaleX),
        layer.height * Math.abs(layer.scaleY),
        dragBounds
      ),
    [layer.width, layer.scaleX, layer.height, layer.scaleY, dragBounds]
  );

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
      dragBoundFunc={handleDragBound}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragMove={e => onChange({ x: e.target.x(), y: e.target.y() })}
      onDragEnd={e => onCommit({ x: e.target.x(), y: e.target.y() })}
      onTransform={() => {
        const node = shapeRef.current;
        if (!node) return;
        constrainImageNode(node, dragBounds);
        onChange(readNodeAttrs(node));
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        constrainImageNode(node, dragBounds);
        onCommit(readNodeAttrs(node));
      }}
    />
  );
}
