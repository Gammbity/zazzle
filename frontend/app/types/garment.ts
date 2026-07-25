export type GarmentType = 't-shirt' | 'hoodie';
export type GarmentSide = 'front' | 'back';
export type GarmentTab = 'image' | 'text' | 'stickers' | 'product';

export interface GarmentPrintArea {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface GarmentCanvasSize {
  width: number;
  height: number;
}

export interface GarmentSideAsset {
  printArea: GarmentPrintArea;
  /** Real editing resolution of this side's flat "Bosma hududi" card. */
  canvasSize: GarmentCanvasSize;
}

export interface GarmentColor {
  name: string;
  value: string;
}
