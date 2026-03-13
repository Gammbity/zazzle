'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { StickerLayer } from '@/types/layer';
import type { Rect } from '@/lib/editor/bounds';
import { clampPosition } from '@/lib/editor/bounds';

interface StickerLayerNodeProps {
  layer: StickerLayer;
  isSelected: boolean;
  dragBounds: Rect;
  transformerRef: React.RefObject<Konva.Transformer>;
  onSelect: () => void;
  onChange: (attrs: Partial<StickerLayer>) => void;
  onCommit: (attrs: Partial<StickerLayer>) => void;
}

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

export default function StickerLayerNode({
  layer,
  isSelected,
  dragBounds,
  transformerRef,
  onSelect,
  onCommit,
}: StickerLayerNodeProps) {
  const shapeRef = useRef<Konva.Image>(null);
  const image = useImage(layer.src);

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
        layer.width * layer.scaleX,
        layer.height * layer.scaleY,
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
      onDragEnd={e => onCommit({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        onCommit({
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
