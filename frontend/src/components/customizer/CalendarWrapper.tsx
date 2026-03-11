'use client';

import SingleSurfaceCustomizer from './SingleSurfaceCustomizer';
import { calendarCustomizerConfig } from './single-surface-presets';

export default function CalendarWrapper() {
  return <SingleSurfaceCustomizer config={calendarCustomizerConfig} />;
}
