import { fabric } from 'fabric';
import SingleSurfacePrintEditor from './SingleSurfacePrintEditor';
import { calendarCustomizerConfig } from './single-surface-presets';

interface CalendarPrintEditorProps {
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onTextureUpdate: (dataUrl: string) => void;
}

export default function CalendarPrintEditor({
  onCanvasReady,
  onTextureUpdate,
}: CalendarPrintEditorProps) {
  return (
    <SingleSurfacePrintEditor
      onCanvasReady={onCanvasReady}
      onTextureUpdate={onTextureUpdate}
      config={calendarCustomizerConfig.editor}
    />
  );
}
