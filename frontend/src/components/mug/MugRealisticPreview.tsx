import CylindricalProductPreview, {
  type CylindricalAngleAsset,
} from '@/components/cylindrical/CylindricalProductPreview';

export const MUG_ANGLE_ASSETS: CylindricalAngleAsset[] = [
  {
    id: 'right',
    label: "O'ng",
    baseSrc: '/products/mug/right.jpg',
    maskSrc: '/products/mug/mask.png',
    shadingSrc: '/products/mug/shading.png',
    displacementSrc: '/products/mug/displacement.png',
  },
];

interface MugRealisticPreviewProps {
  designDataUrl: string;
  onCompositeReady?: (dataUrl: string) => void;
}

export default function MugRealisticPreview({
  designDataUrl,
  onCompositeReady,
}: MugRealisticPreviewProps) {
  return (
    <CylindricalProductPreview
      productSlug='mug'
      productName='Krujka'
      designDataUrl={designDataUrl}
      angleAssets={MUG_ANGLE_ASSETS}
      fallbackPreviewBox={{ x: 18, y: 20, width: 64, height: 50 }}
      previewAltText="Krujkaning haqiqatga yaqin ko'rinishi"
      downloadFileName='krujka-korinishi.png'
      errorMessage="Ko'rinishni tayyorlab bo'lmadi. /public/products/mug/ ichidagi resurslarni tekshiring."
      onCompositeReady={onCompositeReady}
    />
  );
}
