import SingleSurfaceCustomizer from './SingleSurfaceCustomizer';
import { shopperBagCustomizerConfig } from './single-surface-presets';

export default function ShopperBagWrapper() {
  return <SingleSurfaceCustomizer config={shopperBagCustomizerConfig} />;
}
