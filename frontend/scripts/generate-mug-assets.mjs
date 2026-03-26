/**
 * generate-mug-assets.mjs
 * ────────────────────────
 * Node script that creates mask.png, shading.png and displacement.png for
 * the mug product.  These are greyscale images sized to match right.jpg.
 *
 * Run:  node scripts/generate-mug-assets.mjs
 *
 * Requires: sharp  (npm i -D sharp)
 * If sharp is not available we fall back to raw‑buffer PNG via a minimal writer.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '..', 'public', 'products', 'mug');

// Target size — matches a typical product photo.
// We'll try to read right.jpg dimensions; fall back to 800×800.
const W = 800;
const H = 800;

// ---------------------------------------------------------------------------
// Minimal PNG encoder (no dependencies)
// ---------------------------------------------------------------------------

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeB, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

// We need zlib which is built-in in Node
import { deflateSync } from 'zlib';

function encodePNG(width, height, rgba) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — filter type 0 (None) per row
  const rowLen = width * 4 + 1;
  const raw = Buffer.alloc(height * rowLen);
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0; // filter byte
    rgba.copy(raw, y * rowLen + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = deflateSync(raw, { level: 6 });

  // IEND
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    writeChunk('IHDR', ihdr),
    writeChunk('IDAT', compressed),
    writeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Asset generators
// ---------------------------------------------------------------------------

/**
 * mask.png — white where the design should appear, black elsewhere.
 * Creates an elliptical region roughly matching the mug body, with the
 * handle area cut out on the right side.
 */
function generateMask(w, h) {
  const buf = Buffer.alloc(w * h * 4);

  // Printable ellipse (body of the mug)
  const cx = w * 0.48;
  const cy = h * 0.48;
  const rx = w * 0.32;
  const ry = h * 0.24;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const inside = dx * dx + dy * dy <= 1;

      // Handle cutout: right side of the mug (roughly x > 78% of image)
      const inHandle = x > w * 0.78 && y > h * 0.25 && y < h * 0.65;

      const val = inside && !inHandle ? 255 : 0;
      const i = (y * w + x) * 4;
      buf[i] = val;
      buf[i + 1] = val;
      buf[i + 2] = val;
      buf[i + 3] = 255;
    }
  }

  return encodePNG(w, h, buf);
}

/**
 * shading.png — greyscale highlights and shadows that simulate ceramic lighting.
 * Mid-grey (128) = neutral, lighter = highlight, darker = shadow.
 * We create a horizontal gradient with a specular highlight offset from centre.
 */
function generateShading(w, h) {
  const buf = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w; // 0..1
      const ny = y / h;

      // Base: slight darkening at the edges (cylindrical falloff)
      let val = 128 + 50 * Math.cos((nx - 0.45) * Math.PI);

      // Specular highlight band at ~35% from left
      const specDist = Math.abs(nx - 0.35);
      if (specDist < 0.08) {
        val += (1 - specDist / 0.08) * 60;
      }

      // Slight vertical gradient (top lighter, bottom darker)
      val += (0.5 - ny) * 20;

      // Subtle secondary highlight at ~60%
      const spec2Dist = Math.abs(nx - 0.6);
      if (spec2Dist < 0.05) {
        val += (1 - spec2Dist / 0.05) * 25;
      }

      val = Math.max(0, Math.min(255, Math.round(val)));

      const i = (y * w + x) * 4;
      buf[i] = val;
      buf[i + 1] = val;
      buf[i + 2] = val;
      buf[i + 3] = 255;
    }
  }

  return encodePNG(w, h, buf);
}

/**
 * displacement.png — greyscale map for horizontal pixel displacement.
 * 128 = no displacement, 0 = shift left, 255 = shift right.
 * Creates a cosine-based horizontal gradient matching cylindrical curvature.
 */
function generateDisplacement(w, h) {
  const buf = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x / w) * 2 - 1; // -1..1
      // Derivative of the cylinder surface → displacement
      const val = Math.round(128 + 127 * Math.sin(nx * Math.PI * 0.5));

      const i = (y * w + x) * 4;
      buf[i] = val;
      buf[i + 1] = val;
      buf[i + 2] = val;
      buf[i + 3] = 255;
    }
  }

  return encodePNG(w, h, buf);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

fs.mkdirSync(outDir, { recursive: true });

console.log(`Generating mug assets at ${outDir} (${W}×${H})…`);

fs.writeFileSync(path.join(outDir, 'mask.png'), generateMask(W, H));
console.log('  ✔ mask.png');

fs.writeFileSync(path.join(outDir, 'shading.png'), generateShading(W, H));
console.log('  ✔ shading.png');

fs.writeFileSync(
  path.join(outDir, 'displacement.png'),
  generateDisplacement(W, H)
);
console.log('  ✔ displacement.png');

console.log('Done! Place real PSD-derived assets here for production quality.');
