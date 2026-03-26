import { fabric } from 'fabric';
import SingleSurfacePrintEditor from './SingleSurfacePrintEditor';
import { businessCardCustomizerConfig } from './single-surface-presets';

interface BusinessCardPrintEditorProps {
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onTextureUpdate: (dataUrl: string) => void;
}

export default function BusinessCardPrintEditor({
  onCanvasReady,
  onTextureUpdate,
}: BusinessCardPrintEditorProps) {
  return (
    <SingleSurfacePrintEditor
      onCanvasReady={onCanvasReady}
      onTextureUpdate={onTextureUpdate}
      config={businessCardCustomizerConfig.editor}
    />
  );
}
