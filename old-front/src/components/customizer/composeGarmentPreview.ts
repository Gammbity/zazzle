import type { GarmentPrintArea } from './garment-presets';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function composeGarmentPreview(
  garmentImageSrc: string,
  designDataUrl: string,
  printArea: GarmentPrintArea
): Promise<string> {
  const [garmentImg, designImg] = await Promise.all([
    loadImage(garmentImageSrc),
    loadImage(designDataUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = garmentImg.naturalWidth;
  canvas.height = garmentImg.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return garmentImageSrc;

  ctx.drawImage(garmentImg, 0, 0, canvas.width, canvas.height);

  const destX = (printArea.left / 100) * canvas.width;
  const destY = (printArea.top / 100) * canvas.height;
  const destW = (printArea.width / 100) * canvas.width;
  const destH = (printArea.height / 100) * canvas.height;

  ctx.drawImage(designImg, destX, destY, destW, destH);

  return canvas.toDataURL('image/png', 1);
}
