'use client';

import SingleSurfaceViewer from './SingleSurfaceViewer';
import { shopperBagCustomizerConfig } from './single-surface-presets';

interface ShopperBagViewerProps {
  textureUrl: string;
}

export default function ShopperBagViewer({
  textureUrl,
}: ShopperBagViewerProps) {
  return (
    <SingleSurfaceViewer
      textureUrl={textureUrl}
      config={shopperBagCustomizerConfig.viewer}
    />
  );
}
