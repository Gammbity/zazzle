'use client';

import SingleSurfaceViewer from './SingleSurfaceViewer';
import { calendarCustomizerConfig } from './single-surface-presets';

interface CalendarViewerProps {
  textureUrl: string;
}

export default function CalendarViewer({ textureUrl }: CalendarViewerProps) {
  return (
    <SingleSurfaceViewer
      textureUrl={textureUrl}
      config={calendarCustomizerConfig.viewer}
    />
  );
}
