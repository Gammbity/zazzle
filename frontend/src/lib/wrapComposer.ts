/**
 * Wrap composer for mug customization using HTML5 Canvas
 * Handles user image composition with handle cut-out mask
 */

export interface WrapConfig {
  /** Target X position for wrap zone */
  targetX: number; // 80
  /** Target Y position for wrap zone */
  targetY: number; // 80
  /** Target width for wrap zone */
  targetW: number; // 290
  /** Target height for wrap zone */
  targetH: number; // 440
}

/**
 * Handle cut parameters as specified in requirements
 */
export const HANDLE_CUT_CONFIG = {
  /** Width of the handle cut */
  cutW: 55,
  /** Top inset for handle cut */
  cutTopInset: 55,
  /** Bottom inset for handle cut */
  cutBottomInset: 55,
} as const;

/**
 * Creates a mask path for the printable zone with handle cut-out
 * @param ctx Canvas context to draw on
 * @param config Wrap configuration
 */
export function createWrapMask(
  ctx: CanvasRenderingContext2D,
  config: WrapConfig
): void {
  const { targetX: x, targetY: y, targetW: w, targetH: h } = config;
  const { cutW, cutTopInset, cutBottomInset } = HANDLE_CUT_CONFIG;

  const radius = 8; // Rounded corner radius

  ctx.beginPath();

  // Start from top-left corner and go clockwise
  ctx.moveTo(x + radius, y);

  // Top edge to cut area
  ctx.lineTo(x + w - cutW, y);
  ctx.lineTo(x + w - cutW, y + cutTopInset);

  // Handle cut trapezoid (right edge replacement)
  ctx.lineTo(x + w, y + cutTopInset + 25);
  ctx.lineTo(x + w, y + h - cutBottomInset - 25);
  ctx.lineTo(x + w - cutW, y + h - cutBottomInset);

  // Bottom edge
  ctx.lineTo(x + w - cutW, y + h);
  ctx.lineTo(x + radius, y + h);

  // Bottom-left corner
  ctx.arcTo(x, y + h, x, y + h - radius, radius);

  // Left edge
  ctx.lineTo(x, y + radius);

  // Top-left corner
  ctx.arcTo(x, y, x + radius, y, radius);

  ctx.closePath();

  // Fill with opaque white for destination-in compositing
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.fill();
}

/**
 * Applies cover algorithm to fit image within target dimensions
 * @param imgW Image width
 * @param imgH Image height
 * @param targetW Target width
 * @param targetH Target height
 * @returns Scale and offset values
 */
export function calculateCoverTransform(
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number
): { scale: number; dx: number; dy: number } {
  // Cover algorithm: scale to fill entire target area while maintaining aspect ratio
  const scale = Math.max(targetW / imgW, targetH / imgH);

  // Center the scaled image
  const scaledW = imgW * scale;
  const scaledH = imgH * scale;
  const dx = (targetW - scaledW) / 2;
  const dy = (targetH - scaledH) / 2;

  return { scale, dx, dy };
}

/**
 * Composes user image with wrap mask for mug customization
 * @param userImg User's image element
 * @param config Wrap configuration
 * @param devicePixelRatio Device pixel ratio for high-DPI displays
 * @param useMultiplyBlend Whether to use multiply blend mode
 * @returns Composited canvas element
 */
export function composeWrap(
  userImg: HTMLImageElement,
  config: WrapConfig,
  devicePixelRatio: number = 1,
  useMultiplyBlend: boolean = false
): HTMLCanvasElement {
  const { targetW, targetH } = config;

  // Create canvas with high-DPI support
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Cannot get 2D context from canvas');
  }

  // Set canvas size with device pixel ratio
  const canvasW = targetW * devicePixelRatio;
  const canvasH = targetH * devicePixelRatio;

  canvas.width = canvasW;
  canvas.height = canvasH;

  // Scale context for high-DPI rendering
  ctx.scale(devicePixelRatio, devicePixelRatio);

  // Calculate cover transform for user image
  const { scale, dx, dy } = calculateCoverTransform(
    userImg.width,
    userImg.height,
    targetW,
    targetH
  );

  // Step 1: Draw user image with cover scaling
  ctx.drawImage(userImg, dx, dy, userImg.width * scale, userImg.height * scale);

  // Step 2: Apply mask using destination-in composite operation
  ctx.globalCompositeOperation = 'destination-in';

  // Create mask path and fill (simulating config with 0,0 origin for this canvas)
  const maskConfig: WrapConfig = {
    targetX: 0,
    targetY: 0,
    targetW,
    targetH,
  };
  createWrapMask(ctx, maskConfig);

  // Step 3: Reset composite operation
  ctx.globalCompositeOperation = useMultiplyBlend ? 'multiply' : 'source-over';

  return canvas;
}

/**
 * Exports canvas content as PNG data URL
 * @param canvas Canvas element to export
 * @param quality JPEG quality (0-1), ignored for PNG
 * @returns Data URL string
 */
export function exportCanvasAsPNG(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Loads an image from URL or File
 * @param source Image URL string or File object
 * @returns Promise resolving to HTMLImageElement
 */
export function loadImage(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = 'anonymous'; // Prevent CORS issues

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Default wrap configuration for mug customization
 */
export const DEFAULT_WRAP_CONFIG: WrapConfig = {
  targetX: 80,
  targetY: 80,
  targetW: 290,
  targetH: 440,
};
