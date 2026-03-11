'use client';

import { fabric } from 'fabric';
import SingleSurfaceSidebar from './SingleSurfaceSidebar';
import { shopperBagCustomizerConfig } from './single-surface-presets';

interface ShopperBagSidebarProps {
  canvas: fabric.Canvas | null;
}

export default function ShopperBagSidebar({ canvas }: ShopperBagSidebarProps) {
  return (
    <SingleSurfaceSidebar
      canvas={canvas}
      config={shopperBagCustomizerConfig.sidebar}
    />
  );
}
