'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextLayer } from '@/types/layer';
import type { Rect } from '@/lib/editor/bounds';
import { clampPosition } from '@/lib/editor/bounds';

interface TextLayerNodeProps {
  layer: TextLayer;
  isSelected: boolean;
  dragBounds: Rect;
  transformerRef: React.RefObject<Konva.Transformer>;
  onSelect: () => void;
  onChange: (attrs: Partial<TextLayer>) => void;
  onCommit: (attrs: Partial<TextLayer>) => void;
  onDoubleClick?: () => void;
}

export default function TextLayerNode({
  layer,
  isSelected,
  dragBounds,
  transformerRef,
  onSelect,
  onCommit,
  onDoubleClick,
}: TextLayerNodeProps) {
  const shapeRef = useRef<Konva.Text>(null);

  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, transformerRef, layer.id]);

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
      dragBoundFunc={handleDragBound}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDblClick={() => onDoubleClick?.()}
      onDblTap={() => onDoubleClick?.()}
      onDragEnd={e => onCommit({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onCommit({
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
