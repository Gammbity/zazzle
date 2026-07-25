import { fabric } from 'fabric';

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export interface ImageLoadResult {
  ok: boolean;
  error?: string;
}

// Shared by the sidebar's file picker and the stage's direct-drop-on-model
// zone, so both entry points validate and place images identically.
export function useCanvasImageLoader(canvas: Ref<fabric.Canvas | null>) {
  function placeImageOnCanvas(dataUrl: string) {
    const c = canvas.value;
    if (!c) return;
    fabric.Image.fromURL(dataUrl, (image: fabric.Image) => {
      if (!image.width || !image.height) return;
      const scale = Math.min(c.getWidth() / image.width, c.getHeight() / image.height) * 0.8;
      image.set({
        left: c.getWidth() / 2,
        top: c.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true,
      });
      // Tags the object with its editor "kind" so the layers panel can show
      // an accurate label (Rasm/Matn/Emoji) — fabric.js's own `type` can't
      // distinguish a typed text object from an emoji sticker, since both
      // serialize as plain 'text'.
      (image as fabric.Image & { customType?: string }).customType = 'image';
      image.setCoords();
      c.add(image);
      c.setActiveObject(image);
      c.requestRenderAll();
    }, { crossOrigin: 'anonymous' });
  }

  function loadImageFile(file: File): Promise<ImageLoadResult> {
    return new Promise((resolve) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        resolve({ ok: false, error: `Noto'g'ri fayl turi: ${file.type || 'noma\'lum'}. PNG, JPG, WebP yoki GIF yuboring.` });
        return;
      }
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > MAX_FILE_SIZE_MB) {
        resolve({ ok: false, error: `Fayl hajmi ${sizeMb.toFixed(1)} MB. Limit ${MAX_FILE_SIZE_MB} MB dan oshmasligi kerak.` });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = typeof event.target?.result === 'string' ? event.target.result : '';
        if (!dataUrl) {
          resolve({ ok: false, error: 'Faylni o\'qib bo\'lmadi. Qayta urinib ko\'ring.' });
          return;
        }
        placeImageOnCanvas(dataUrl);
        resolve({ ok: true });
      };
      reader.onerror = () => resolve({ ok: false, error: 'Faylni o\'qishda xatolik yuz berdi.' });
      reader.readAsDataURL(file);
    });
  }

  return { placeImageOnCanvas, loadImageFile, MAX_FILE_SIZE_MB, ALLOWED_TYPES };
}
