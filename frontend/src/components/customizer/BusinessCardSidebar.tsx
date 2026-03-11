'use client';

import { fabric } from 'fabric';
import SingleSurfaceSidebar from './SingleSurfaceSidebar';
import { businessCardCustomizerConfig } from './single-surface-presets';

interface BusinessCardSidebarProps {
  canvas: fabric.Canvas | null;
}

export default function BusinessCardSidebar({
  canvas,
}: BusinessCardSidebarProps) {
  return (
    <SingleSurfaceSidebar
      canvas={canvas}
      config={businessCardCustomizerConfig.sidebar}
    />
  );
}
