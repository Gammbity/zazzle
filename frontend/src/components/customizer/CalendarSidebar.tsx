import { fabric } from 'fabric';
import SingleSurfaceSidebar from './SingleSurfaceSidebar';
import { calendarCustomizerConfig } from './single-surface-presets';

interface CalendarSidebarProps {
  canvas: fabric.Canvas | null;
}

export default function CalendarSidebar({ canvas }: CalendarSidebarProps) {
  return (
    <SingleSurfaceSidebar
      canvas={canvas}
      config={calendarCustomizerConfig.sidebar}
    />
  );
}
