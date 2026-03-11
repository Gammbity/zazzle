'use client';

import SingleSurfaceViewer from './SingleSurfaceViewer';
import { businessCardCustomizerConfig } from './single-surface-presets';

interface BusinessCardViewerProps {
  textureUrl: string;
}

export default function BusinessCardViewer({
  textureUrl,
}: BusinessCardViewerProps) {
  return (
    <SingleSurfaceViewer
      textureUrl={textureUrl}
      config={businessCardCustomizerConfig.viewer}
    />
  );
}
