import { fabric } from 'fabric';

// Renders a saved fabric.js draft (the JSON snapshot useFabricHistory
// autosaves to localStorage) to a PNG data URL using an off-screen canvas —
// lets the 3D preview show BOTH sides of a garment even though only one
// side's canvas is "live" in the editor at a time.
export function renderFabricDraftToDataUrl(json: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const el = document.createElement('canvas');
      const canvas = new fabric.StaticCanvas(el, { width, height, backgroundColor: 'transparent' });
      void canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
        canvas.dispose();
        resolve(dataUrl);
      });
    }
    catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to render draft'));
    }
  });
}
