'use client';

import SingleSurfaceCustomizer from './SingleSurfaceCustomizer';
import { businessCardCustomizerConfig } from './single-surface-presets';

export default function BusinessCardWrapper() {
  return <SingleSurfaceCustomizer config={businessCardCustomizerConfig} />;
}
