import { fabric } from 'fabric';
import SingleSurfacePrintEditor from './SingleSurfacePrintEditor';
import { shopperBagCustomizerConfig } from './single-surface-presets';

interface ShopperBagPrintEditorProps {
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onTextureUpdate: (dataUrl: string) => void;
}

export default function ShopperBagPrintEditor({
  onCanvasReady,
  onTextureUpdate,
}: ShopperBagPrintEditorProps) {
  return (
    <SingleSurfacePrintEditor
      onCanvasReady={onCanvasReady}
      onTextureUpdate={onTextureUpdate}
      config={shopperBagCustomizerConfig.editor}
    />
  );
}
