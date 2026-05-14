import Konva from 'konva';
import { printAreaToRect } from '@/lib/editor/bounds';
import { GLYPH_SAFE_PADDING } from '@/lib/editor/export';
import type { Layer } from '@/types/layer';
import type { PrintArea } from '@/types/product';

interface RenderSurfacePreviewOptions {
  layers: Layer[];
  printArea: PrintArea;
  canvasWidth: number;
  canvasHeight: number;
  cropToPrintArea?: boolean;
  pixelRatio?: number;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

export async function renderSurfacePreview({
  layers,
  printArea,
  canvasWidth,
  canvasHeight,
  cropToPrintArea = true,
  pixelRatio = 2,
}: RenderSurfacePreviewOptions): Promise<string> {
  const container = document.createElement('div');
  const stage = new Konva.Stage({
    container,
    width: canvasWidth,
    height: canvasHeight,
  });
  const konvaLayer = new Konva.Layer({ listening: false });

  stage.add(konvaLayer);

  const sortedLayers = [...layers]
    .filter(layer => layer.visible)
    .sort((left, right) => left.zIndex - right.zIndex);

  for (const layer of sortedLayers) {
    if (layer.type === 'image' || layer.type === 'sticker') {
      const image = await loadImageElement(layer.src);

      konvaLayer.add(
        new Konva.Image({
          image,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          scaleX: layer.scaleX,
          scaleY: layer.scaleY,
          rotation: layer.rotation,
          opacity: layer.opacity,
          perfectDrawEnabled: false,
          listening: false,
        })
      );

      continue;
    }

    konvaLayer.add(
      new Konva.Text({
        text: layer.text,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        fontSize: layer.fontSize,
        fontFamily: layer.fontFamily,
        fontStyle: layer.fontStyle || 'normal',
        fill: layer.fill,
        align: layer.align,
        scaleX: layer.scaleX,
        scaleY: layer.scaleY,
        rotation: layer.rotation,
        opacity: layer.opacity,
        listening: false,
      })
    );
  }

  konvaLayer.draw();

  const options: Parameters<typeof konvaLayer.toDataURL>[0] = { pixelRatio };

  if (cropToPrintArea) {
    const rect = printAreaToRect(printArea, canvasWidth, canvasHeight);
    const x = Math.max(0, rect.x - GLYPH_SAFE_PADDING);
    const y = Math.max(0, rect.y - GLYPH_SAFE_PADDING);

    options.x = x;
    options.y = y;
    options.width = Math.min(
      canvasWidth - x,
      rect.width + GLYPH_SAFE_PADDING * 2
    );
    options.height = Math.min(
      canvasHeight - y,
      rect.height + GLYPH_SAFE_PADDING * 2
    );
  }

  const url = konvaLayer.toDataURL(options);

  stage.destroy();
  container.remove();

  return url;
}
