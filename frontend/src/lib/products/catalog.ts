/** Product catalog types and data for the Zazzle Uzbekistan MVP. */

import {
  MUG_SAFE_ZONE_X_PCT,
  MUG_SAFE_ZONE_WIDTH_PCT,
} from '@/components/customizer/mugPrintConstants';
import {
  PEN_SAFE_ZONE_HEIGHT_PCT,
  PEN_SAFE_ZONE_WIDTH_PCT,
  PEN_SAFE_ZONE_X_PCT,
  PEN_SAFE_ZONE_Y_PCT,
} from '@/components/customizer/penPrintConstants';

export interface OverlayBox {
  /** X offset as percentage of container width */
  x: number;
  /** Y offset as percentage of container height */
  y: number;
  /** Width as percentage of container width */
  width: number;
  /** Height as percentage of container height */
  height: number;
}

/** Rectangle within the canvas that defines the safe print zone (percentage-based). */
export interface PrintableArea {
  /** X offset as percentage of canvas width */
  x: number;
  /** Y offset as percentage of canvas height */
  y: number;
  /** Width as percentage of canvas width */
  width: number;
  /** Height as percentage of canvas height */
  height: number;
  /** Default scale for new layers on this angle */
  defaultScale?: number;
  /** Default rotation for new layers on this angle (degrees) */
  defaultRotation?: number;
}

export interface ProductAngle {
  id: string;
  label: string;
  /** Path relative to /public */
  src: string;
  alt: string;
  /** Print-safe zone specific to this angle */
  printableArea: PrintableArea;
  /** Overlay bounding box for legacy compatibility */
  overlayBox?: OverlayBox;
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  startingPrice: string;
  /** Card thumbnail shown on home page */
  thumbnail: string;
  /** Gallery images (different angles) with per-angle printable areas */
  angles: ProductAngle[];
  /** Bounding box for the design overlay on the base image (legacy) */
  overlayBox: OverlayBox;
  /** Recommended canvas aspect ratio */
  canvasAspect: number;
  /** Base image used for the mock preview (legacy) */
  previewBase: string;
  /** Visual style hint for the preview renderer */
  previewStyle: 'flat' | 'perspective';
  tags: string[];
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const catalog: Product[] = [
  {
    slug: 't-shirt',
    name: 'Futbolka',
    tagline: 'Ijodingizni kiying',
    description:
      "Sifatli paxtali futbolka ustiga o'zingiz xohlagan dizaynni joylashtiring. Kundalik kiyim, jamoa libosi va sovg'a uchun mos.",
    startingPrice: '85 000 UZS',
    thumbnail: '/products/t-shirt/front.jpg',
    angles: [
      {
        id: 'front',
        label: 'Old tomoni',
        src: '/products/t-shirt/front.jpg',
        alt: 'Futbolkaning old tomoni',
        printableArea: {
          x: 5,
          y: 5,
          width: 90,
          height: 90,
          defaultScale: 1,
          defaultRotation: 0,
        },
        overlayBox: { x: 18.5, y: 22, width: 63, height: 70 },
      },
      {
        id: 'back',
        label: 'Orqa tomoni',
        src: '/products/t-shirt/back.jpg',
        alt: 'Futbolkaning orqa tomoni',
        printableArea: {
          x: 5,
          y: 5,
          width: 90,
          height: 90,
          defaultScale: 1,
          defaultRotation: 0,
        },
        overlayBox: { x: 18.5, y: 22, width: 63, height: 70 },
      },
    ],
    overlayBox: { x: 18.5, y: 22, width: 63, height: 70 },
    canvasAspect: 0.7,
    previewBase: '/products/t-shirt/front.jpg',
    previewStyle: 'flat',
    tags: ['apparel', 'cotton', 'unisex'],
  },
  {
    slug: 'mug',
    name: 'Krujka',
    tagline: 'Did bilan iching',
    description:
      "Oq keramik krujka ustiga yozuv, logo yoki rasm joylashtiring. Sovg'a va ofis uchun qulay variant.",
    startingPrice: '65 000 UZS',
    thumbnail: '/products/mug/right.jpg',
    angles: [
      {
        id: 'right',
        label: "O'ng tomoni",
        src: '/products/mug/right.jpg',
        alt: "Krujkaning o'ng tomoni",
        printableArea: {
          // x and width come from MUG_HANDLE_MARGIN_PX (1cm each side)
          // so the Konva editor enforces the SAME boundary as PrintEditor.
          x: MUG_SAFE_ZONE_X_PCT, // ≈ 3.33%
          y: 20,
          width: MUG_SAFE_ZONE_WIDTH_PCT, // ≈ 93.33%
          height: 60,
          defaultScale: 0.7,
          defaultRotation: 0,
        },
        overlayBox: { x: 18, y: 20, width: 64, height: 50 },
      },
      {
        id: 'left',
        label: 'Chap tomoni',
        src: '/products/mug/left.jpg',
        alt: 'Krujkaning chap tomoni',
        printableArea: {
          x: MUG_SAFE_ZONE_X_PCT,
          y: 20,
          width: MUG_SAFE_ZONE_WIDTH_PCT,
          height: 60,
          defaultScale: 0.7,
          defaultRotation: 0,
        },
        overlayBox: { x: 18, y: 20, width: 64, height: 50 },
      },
      {
        id: 'back',
        label: 'Orqa tomoni',
        src: '/products/mug/back.jpg',
        alt: 'Krujkaning orqa tomoni',
        printableArea: {
          x: MUG_SAFE_ZONE_X_PCT,
          y: 20,
          width: MUG_SAFE_ZONE_WIDTH_PCT,
          height: 60,
          defaultScale: 0.7,
          defaultRotation: 0,
        },
        overlayBox: { x: 18, y: 20, width: 64, height: 50 },
      },
    ],
    overlayBox: { x: 18, y: 20, width: 64, height: 50 },
    canvasAspect: 1.4,
    previewBase: '/products/mug/right.jpg',
    previewStyle: 'perspective',
    tags: ['drinkware', 'ceramic', 'gift'],
  },
  {
    slug: 'business-card',
    name: 'Vizitka',
    tagline: 'Yaxshi taassurot qoldiring',
    description:
      "Ikki tomonlama vizitka dizaynini tayyorlab, professional ko'rinish yarating. Uchrashuv va tanishuvlar uchun qulay.",
    startingPrice: '75 000 UZS',
    thumbnail: '/products/business-card/front.jpg',
    angles: [
      {
        id: 'front',
        label: 'Old tomoni',
        src: '/products/business-card/front.jpg',
        alt: 'Vizitkaning old tomoni',
        printableArea: {
          x: 10,
          y: 15,
          width: 80,
          height: 70,
          defaultScale: 0.9,
          defaultRotation: 0,
        },
        overlayBox: { x: 10, y: 15, width: 80, height: 70 },
      },
      {
        id: 'back',
        label: 'Orqa tomoni',
        src: '/products/business-card/front.jpg',
        alt: 'Vizitkaning orqa tomoni',
        printableArea: {
          x: 10,
          y: 15,
          width: 80,
          height: 70,
          defaultScale: 0.9,
          defaultRotation: 0,
        },
        overlayBox: { x: 10, y: 15, width: 80, height: 70 },
      },
    ],
    overlayBox: { x: 10, y: 15, width: 80, height: 70 },
    canvasAspect: 1.75,
    previewBase: '/products/business-card/front.jpg',
    previewStyle: 'flat',
    tags: ['stationery', 'professional', 'cardstock'],
  },
  {
    slug: 'desk-calendar',
    name: 'Stol kalendari',
    tagline: 'Yilingizni shaxsiylashtiring',
    description:
      "Stol kalendari ustiga foto, logo yoki aksiyani joylashtiring. Ofis, sovg'a va brend ko'rinishi uchun mos.",
    startingPrice: '120 000 UZS',
    thumbnail: '/products/desk-calendar/front.jpg',
    angles: [
      {
        id: 'front',
        label: 'Old tomoni',
        src: '/products/desk-calendar/front.jpg',
        alt: 'Stol kalendarining old tomoni',
        printableArea: {
          x: 11.5,
          y: 18,
          width: 77,
          height: 67,
          defaultScale: 0.8,
          defaultRotation: 0,
        },
        overlayBox: { x: 11.5, y: 18, width: 77, height: 67 },
      },
    ],
    overlayBox: { x: 11.5, y: 18, width: 77, height: 67 },
    canvasAspect: 1.16,
    previewBase: '/products/desk-calendar/front.jpg',
    previewStyle: 'flat',
    tags: ['stationery', 'gift', 'office'],
  },
  {
    slug: 'pen',
    name: 'Ruchka',
    tagline: "Brendingizni qo'lda olib yuring",
    description:
      "Minimal oq promo ruchka ustiga logo, brend nomi yoki qisqa dizaynni joylashtiring. 3D/360 ko'rinish orqali bosma barrel bo'ylab qanday aylanishini oldindan tekshirish mumkin.",
    startingPrice: '18 000 UZS',
    thumbnail: '/products/pen/side.svg',
    angles: [
      {
        id: 'side',
        label: 'Yon tomoni',
        src: '/products/pen/side.svg',
        alt: 'Ruchkaning yon tomoni',
        printableArea: {
          x: PEN_SAFE_ZONE_X_PCT,
          y: PEN_SAFE_ZONE_Y_PCT,
          width: PEN_SAFE_ZONE_WIDTH_PCT,
          height: PEN_SAFE_ZONE_HEIGHT_PCT,
          defaultScale: 0.95,
          defaultRotation: 0,
        },
        overlayBox: { x: 28.75, y: 40, width: 45, height: 20 },
      },
    ],
    overlayBox: { x: 28.75, y: 40, width: 45, height: 20 },
    canvasAspect: 4.5,
    previewBase: '/products/pen/side.svg',
    previewStyle: 'perspective',
    tags: ['office', 'branding', 'gift'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a product by its URL slug. Returns `undefined` when not found. */
export function getProductBySlug(slug: string): Product | undefined {
  return catalog.find(p => p.slug === slug);
}

/** All valid slugs – handy for `generateStaticParams`. */
export function getAllSlugs(): string[] {
  return catalog.map(p => p.slug);
}
