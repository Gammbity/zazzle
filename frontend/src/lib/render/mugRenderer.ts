/**
 * mugRenderer.ts
 * ──────────────
 * Pure-function rendering pipeline that composites a user design onto a mug
 * photograph with **true cylindrical UV mapping**, Fresnel edge darkening,
 * mask clipping, and ceramic-style shading.
 *
 * The cylinder projection uses an arcsin inverse so that horizontal
 * compression accelerates towards the edges — the signature visual cue of
 * wrapping a flat image around a cylindrical surface.
 *
 * Public API:
 *   composeMugPreview(opts) → Promise<string>  (data-URL)
 *   loadImage(src)          → Promise<HTMLImageElement>
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MugRenderOptions {
  /** User design as data-URL or object-URL. */
  designSrc: string;
  /** Base mug photo (/products/mug/right.jpg). */
  baseSrc: string;
  /** Greyscale mask — white = printable area (/products/mug/mask.png). */
  maskSrc: string;
  /** Shading / highlight overlay (/products/mug/shading.png). */
  shadingSrc: string;
  /** Optional greyscale displacement map (/products/mug/displacement.png). */
  displacementSrc?: string;

  /** Design placement box on the base image (pixels at 1× scale). */
  designBox: { x: number; y: number; w: number; h: number };

  /** 0–1 — strength of the cylindrical warp. 0 = flat, 1 = full wrap. */
  warpIntensity?: number;
  /** 0.5–1 — opacity of the printed design. Lower = more "ink on ceramic". */
  printOpacity?: number;
  /** Visible arc of the cylinder in degrees (default 70). */
  maxAngleDeg?: number;
  /** Output resolution multiplier (default 1). */
  pixelRatio?: number;
  /** Optional product body colour chosen in the product panel. */
  bodyColorHex?: string;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

// ---------------------------------------------------------------------------
// Image loader (cached)
// ---------------------------------------------------------------------------

const _cache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = _cache.get(src);
  if (cached?.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      _cache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// ---------------------------------------------------------------------------
// Bilinear sampler (shared helper)
// ---------------------------------------------------------------------------

function bilinearSample(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  sx: number,
  sy: number
): [number, number, number, number] {
  // Clamp to valid range
  const cx = Math.max(0, Math.min(sx, w - 1.001));
  const cy = Math.max(0, Math.min(sy, h - 1.001));

  const fx = Math.floor(cx);
  const fy = Math.floor(cy);
  const dx = cx - fx;
  const dy = cy - fy;

  const fx1 = Math.min(fx + 1, w - 1);
  const fy1 = Math.min(fy + 1, h - 1);

  const i00 = (fy * w + fx) * 4;
  const i10 = (fy * w + fx1) * 4;
  const i01 = (fy1 * w + fx) * 4;
  const i11 = (fy1 * w + fx1) * 4;

  const result: [number, number, number, number] = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    result[c] =
      data[i00 + c] * (1 - dx) * (1 - dy) +
      data[i10 + c] * dx * (1 - dy) +
      data[i01 + c] * (1 - dx) * dy +
      data[i11 + c] * dx * dy;
  }
  return result;
}

// ---------------------------------------------------------------------------
// True cylindrical warp (arcsin UV mapping)
// ---------------------------------------------------------------------------

/**
 * Maps a flat design onto a cylinder surface using proper perspective
 * projection with arcsin inverse mapping.
 *
 * For each output column x with normalised position screenX ∈ [-1, 1]:
 *   θ = arcsin(screenX × sin(maxAngle))        — viewing angle on cylinder
 *   u = (θ / maxAngle + 1) / 2                  — texture U coordinate [0,1]
 *   cos(θ)                                       — Fresnel brightness falloff
 *   vertical scale = perspective foreshortening   — slight pinch at edges
 *
 * `intensity` interpolates between flat (0) and full cylindrical (1).
 * `maxAngle` controls how much of the cylinder is visible (default ~70°).
 */
export function cylindricalWarp(
  design: HTMLImageElement | HTMLCanvasElement,
  intensity: number,
  outW: number,
  outH: number,
  maxAngleDeg = 70
): HTMLCanvasElement {
  const src = toCanvas(design, outW, outH);
  const srcCtx = src.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, outW, outH);

  const dst = createCanvas(outW, outH);
  const dstCtx = dst.getContext('2d')!;
  const dstData = dstCtx.createImageData(outW, outH);

  const maxAngle = (maxAngleDeg * Math.PI) / 180;
  const sinMax = Math.sin(maxAngle);
  const midY = outH / 2;

  for (let x = 0; x < outW; x++) {
    // Screen-space normalised x  ∈ [-1, 1]
    const screenX = (x / (outW - 1)) * 2 - 1;

    // --- Cylindrical inverse projection ---
    // On a cylinder, screen position = sin(θ) / sin(maxAngle)
    // So θ = arcsin(screenX × sin(maxAngle))
    const sinTheta = screenX * sinMax;
    const theta = Math.asin(Math.max(-1, Math.min(1, sinTheta)));

    // Texture U: linear in θ (equal arc-length mapping)
    const cylU = (theta / maxAngle + 1) / 2; // [0, 1]

    // Source X: blend between linear (flat) and cylindrical based on intensity
    const flatU = (screenX + 1) / 2;
    const u = flatU + intensity * (cylU - flatU);
    const srcX = u * (outW - 1);

    // --- Fresnel / edge brightness ---
    // cos(θ) = sqrt(1 - sin²θ)  — surface normal dot view direction
    const cosTheta = Math.sqrt(1 - sinTheta * sinTheta);
    // Smooth brightness falloff, stronger at edges
    const fresnel = 1 - intensity * 0.25 * (1 - cosTheta);

    // --- Vertical foreshortening (perspective) ---
    // At the edges of the cylinder, apparent height is slightly less.
    // Model as slight vertical scale: lerp(1, cosTheta, intensity × 0.15)
    const vScale = 1 - intensity * 0.15 * (1 - cosTheta);

    for (let y = 0; y < outH; y++) {
      // Inverse vertical scale from midline
      const srcY = midY + (y - midY) / vScale;

      if (srcX < 0 || srcX >= outW - 1 || srcY < 0 || srcY >= outH - 1)
        continue;

      const [r, g, b, a] = bilinearSample(srcData.data, outW, outH, srcX, srcY);

      const dstIdx = (y * outW + x) * 4;
      dstData.data[dstIdx + 0] = Math.min(255, r * fresnel);
      dstData.data[dstIdx + 1] = Math.min(255, g * fresnel);
      dstData.data[dstIdx + 2] = Math.min(255, b * fresnel);
      dstData.data[dstIdx + 3] = a;
    }
  }

  dstCtx.putImageData(dstData, 0, 0);
  return dst;
}

// ---------------------------------------------------------------------------
// Displacement-map warp (additive to cylindrical)
// ---------------------------------------------------------------------------

/**
 * Warp `design` using a greyscale displacement map.
 * Pixel at (x,y) is displaced horizontally by:
 *   offset = (mapLuminance − 0.5) × maxDisplacement × intensity
 */
export function displacementWarp(
  design: HTMLImageElement | HTMLCanvasElement,
  displacementMap: HTMLImageElement | HTMLCanvasElement,
  intensity: number,
  outW: number,
  outH: number,
  maxDisplacement = 20
): HTMLCanvasElement {
  const src = toCanvas(design, outW, outH);
  const srcCtx = src.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, outW, outH);

  const map = toCanvas(displacementMap, outW, outH);
  const mapCtx = map.getContext('2d')!;
  const mapData = mapCtx.getImageData(0, 0, outW, outH);

  const dst = createCanvas(outW, outH);
  const dstCtx = dst.getContext('2d')!;
  const dstData = dstCtx.createImageData(outW, outH);

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const mi = (y * outW + x) * 4;
      const lum =
        (mapData.data[mi] + mapData.data[mi + 1] + mapData.data[mi + 2]) /
        (3 * 255);
      const offsetX = (lum - 0.5) * maxDisplacement * intensity;
      const offsetY = (lum - 0.5) * maxDisplacement * intensity * 0.2;

      const sx = x + offsetX;
      const sy = y + offsetY;

      if (sx < 0 || sx >= outW - 1 || sy < 0 || sy >= outH - 1) continue;

      const [r, g, b, a] = bilinearSample(srcData.data, outW, outH, sx, sy);
      const dstIdx = (y * outW + x) * 4;
      dstData.data[dstIdx + 0] = r;
      dstData.data[dstIdx + 1] = g;
      dstData.data[dstIdx + 2] = b;
      dstData.data[dstIdx + 3] = a;
    }
  }

  dstCtx.putImageData(dstData, 0, 0);
  return dst;
}

// ---------------------------------------------------------------------------
// Mask clipping
// ---------------------------------------------------------------------------

/**
 * Multiply the alpha channel of `design` by the luminance of `mask`.
 * Black mask pixels → transparent.  White → fully visible.
 */
export function applyMask(
  design: HTMLCanvasElement,
  mask: HTMLImageElement | HTMLCanvasElement
): HTMLCanvasElement {
  const w = design.width;
  const h = design.height;

  const designCtx = design.getContext('2d')!;
  const designData = designCtx.getImageData(0, 0, w, h);

  const maskCanvas = toCanvas(mask, w, h);
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.getImageData(0, 0, w, h);

  for (let i = 0; i < designData.data.length; i += 4) {
    const lum =
      (maskData.data[i] + maskData.data[i + 1] + maskData.data[i + 2]) /
      (3 * 255);
    designData.data[i + 3] = Math.round(designData.data[i + 3] * lum);
  }

  designCtx.putImageData(designData, 0, 0);
  return design;
}

// ---------------------------------------------------------------------------
// Shading overlay (ceramic lighting)
// ---------------------------------------------------------------------------

/**
 * Bake ceramic-style lighting into the design in three composite passes:
 *   1. `multiply`  — shadows darken the design (like ink under a glaze)
 *   2. `overlay`   — mid-tone contrast for depth
 *   3. `screen`    — ceramic specular highlights brighten through the design
 */
export function applyShading(
  design: HTMLCanvasElement,
  shading: HTMLImageElement | HTMLCanvasElement,
  opacity = 0.5
): HTMLCanvasElement {
  const ctx = design.getContext('2d')!;
  const w = design.width;
  const h = design.height;

  // Pass 1: multiply — shadows
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = opacity;
  ctx.drawImage(shading, 0, 0, w, h);
  ctx.restore();

  // Pass 2: overlay — mid-tone depth
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = opacity * 0.3;
  ctx.drawImage(shading, 0, 0, w, h);
  ctx.restore();

  // Pass 3: screen — specular highlight punch-through
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = opacity * 0.15;
  ctx.drawImage(shading, 0, 0, w, h);
  ctx.restore();

  return design;
}

// ---------------------------------------------------------------------------
// Full compose pipeline
// ---------------------------------------------------------------------------

/**
 * End-to-end mug rendering.
 * Returns a data-URL of the final composite at the base image's native size.
 *
 * Compositing order:
 *   1. Draw base mug photo
 *   2. Draw warped design using `multiply` blend (printed-on-ceramic look)
 *   3. Re-draw design with `screen` at low opacity (ink vibrancy)
 *   4. Re-draw shading overlay on top for ceramic reflections
 */
export async function composeMugPreview(
  opts: MugRenderOptions
): Promise<string> {
  const {
    designSrc,
    baseSrc,
    maskSrc,
    shadingSrc,
    displacementSrc,
    designBox,
    warpIntensity = 0.55,
    printOpacity = 0.88,
    maxAngleDeg = 70,
    pixelRatio = 1,
    bodyColorHex,
  } = opts;

  // 1. Load all assets in parallel
  const loads: Promise<HTMLImageElement>[] = [
    loadImage(designSrc),
    loadImage(baseSrc),
    loadImage(maskSrc),
    loadImage(shadingSrc),
  ];
  if (displacementSrc) loads.push(loadImage(displacementSrc));
  const images = await Promise.all(loads);

  const [designImg, baseImg, maskImg, shadingImg] = images;
  const dispImg = displacementSrc ? images[4] : undefined;

  const outW = Math.round(baseImg.naturalWidth * pixelRatio);
  const outH = Math.round(baseImg.naturalHeight * pixelRatio);

  // Use Math.ceil for width/height so the right and bottom pixels of the
  // design box are never dropped by floor-rounding (right-edge glyph safety).
  const dBoxW = Math.ceil(designBox.w * pixelRatio);
  const dBoxH = Math.ceil(designBox.h * pixelRatio);
  // x/y offsets use round – floor would be fine too since we only lose left pixels
  const dBoxX = Math.round(designBox.x * pixelRatio);
  const dBoxY = Math.round(designBox.y * pixelRatio);

  // 2. Cylindrical warp (arcsin UV)
  let warped = cylindricalWarp(
    designImg,
    warpIntensity,
    dBoxW,
    dBoxH,
    maxAngleDeg
  );

  // 2b. Optional displacement warp
  if (dispImg) {
    warped = displacementWarp(warped, dispImg, warpIntensity, dBoxW, dBoxH);
  }

  // 3. Mask the warped design
  warped = applyMask(warped, maskImg);

  // 4. Bake shading into the design (ceramic lighting)
  warped = applyShading(warped, shadingImg, 0.45);

  // 5. Final composite
  const out = createCanvas(outW, outH);
  const ctx = out.getContext('2d')!;

  // 5a. Draw base mug
  ctx.drawImage(baseImg, 0, 0, outW, outH);
  tintNeutralProductPixels(ctx, outW, outH, bodyColorHex);

  // 5b. Multiply-blend the design onto the mug (ink-on-ceramic)
  ctx.save();
  ctx.globalAlpha = printOpacity;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(warped, dBoxX, dBoxY, dBoxW, dBoxH);
  ctx.restore();

  // 5c. Screen-blend at low opacity for colour vibrancy
  ctx.save();
  ctx.globalAlpha = printOpacity * 0.35;
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(warped, dBoxX, dBoxY, dBoxW, dBoxH);
  ctx.restore();

  // 5d. Overlay the shading map on top for ceramic highlights/reflections
  //     (cropped to the design box so it only affects the print area)
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(shadingImg, dBoxX, dBoxY, dBoxW, dBoxH);
  ctx.restore();

  return out.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function parseHexColor(hex?: string): Rgb | null {
  const match = (hex ?? '').match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!match) return null;

  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function isNearlyWhite(color: Rgb): boolean {
  return color.r >= 244 && color.g >= 244 && color.b >= 244;
}

function pixelMetrics(
  data: Uint8ClampedArray,
  index: number
): { luminance: number; spread: number } {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];

  return {
    luminance: 0.299 * r + 0.587 * g + 0.114 * b,
    spread: Math.max(r, g, b) - Math.min(r, g, b),
  };
}

function isBackgroundCandidate(
  data: Uint8ClampedArray,
  pixelIndex: number
): boolean {
  const index = pixelIndex * 4;
  const alpha = data[index + 3];
  const { luminance, spread } = pixelMetrics(data, index);
  return alpha <= 12 || (luminance > 112 && spread < 86);
}

function isTintCandidate(data: Uint8ClampedArray, pixelIndex: number): boolean {
  const index = pixelIndex * 4;
  const alpha = data[index + 3];
  const { luminance, spread } = pixelMetrics(data, index);
  return alpha > 12 && luminance > 145 && spread < 72;
}

function markBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8Array {
  const background = new Uint8Array(width * height);
  const queue: number[] = [];

  const push = (pixelIndex: number) => {
    if (background[pixelIndex] || !isBackgroundCandidate(data, pixelIndex)) {
      return;
    }

    background[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const x = current % width;
    const y = Math.floor(current / width);

    if (x > 0) push(current - 1);
    if (x < width - 1) push(current + 1);
    if (y > 0) push(current - width);
    if (y < height - 1) push(current + width);
  }

  return background;
}

function tintNeutralProductPixels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bodyColorHex?: string
) {
  const color = parseHexColor(bodyColorHex);
  if (!color || isNearlyWhite(color)) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const background = markBackground(data, width, height);

  for (let pixelIndex = 0; pixelIndex < background.length; pixelIndex += 1) {
    if (background[pixelIndex] || !isTintCandidate(data, pixelIndex)) {
      continue;
    }

    const index = pixelIndex * 4;
    const { luminance } = pixelMetrics(data, index);
    const shade = Math.max(0.22, Math.min(1.15, luminance / 235));
    const strength = Math.max(0.42, Math.min(0.9, (luminance - 125) / 125));

    data[index] = Math.round(
      data[index] * (1 - strength) + Math.min(255, color.r * shade) * strength
    );
    data[index + 1] = Math.round(
      data[index + 1] * (1 - strength) +
        Math.min(255, color.g * shade) * strength
    );
    data[index + 2] = Math.round(
      data[index + 2] * (1 - strength) +
        Math.min(255, color.b * shade) * strength
    );
  }

  ctx.putImageData(imageData, 0, 0);
}

function toCanvas(
  src: HTMLImageElement | HTMLCanvasElement,
  w: number,
  h: number
): HTMLCanvasElement {
  if (src instanceof HTMLCanvasElement && src.width === w && src.height === h) {
    return src;
  }
  const c = createCanvas(w, h);
  c.getContext('2d')!.drawImage(src, 0, 0, w, h);
  return c;
}
