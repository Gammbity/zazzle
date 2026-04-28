import { forwardRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import type { Rect } from '@/lib/editor/bounds';
import { constrainBox } from '@/lib/editor/bounds';

interface SelectionTransformerProps {
  /** The print-area rect in canvas-pixel coordinates. */
  printAreaRect: Rect;
}

/**
 * A persistent Konva Transformer mounted alongside the design layer.
 * Nodes are attached externally via the forwarded ref.
 * boundBoxFunc constraints are derived from the printAreaRect so no
 * product geometry is hardcoded here.
 */
const SelectionTransformer = forwardRef<
  Konva.Transformer,
  SelectionTransformerProps
>(function SelectionTransformer({ printAreaRect }, ref) {
  return (
    <Transformer
      ref={ref}
      rotateEnabled
      enabledAnchors={[
        'top-left',
        'top-center',
        'top-right',
        'middle-left',
        'middle-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ]}
      boundBoxFunc={(oldBox, newBox) =>
        constrainBox(oldBox, newBox, printAreaRect)
      }
      flipEnabled={false}
      ignoreStroke
      padding={-6}
    />
  );
});

export default SelectionTransformer;
