import type { CSSProperties } from 'react';

export interface SingleSurfaceViewerConfig {
  productImageSrc: string;
  productImageAlt: string;
  exportMessage: string;
  stageStyle: CSSProperties;
  overlayStyle: CSSProperties;
}

export interface SingleSurfaceEditorConfig {
  canvasWidth: number;
  canvasHeight: number;
  title: string;
  legend: string;
}

export interface SingleSurfaceSidebarConfig {
  title: string;
  description: string;
  defaultText: string;
  defaultTextFontSize: number;
  stickerFontSize: number;
  stickers: string[];
}

export interface SingleSurfaceCustomizerConfig {
  viewer: SingleSurfaceViewerConfig;
  editor: SingleSurfaceEditorConfig;
  sidebar: SingleSurfaceSidebarConfig;
}

export const businessCardCustomizerConfig: SingleSurfaceCustomizerConfig = {
  viewer: {
    productImageSrc: '/products/business-card/front.jpg',
    productImageAlt: 'Business Card',
    exportMessage: 'Business Card export composite render bilan ishlaydi.',
    stageStyle: {
      position: 'relative',
      width: '90%',
      maxWidth: '800px',
      aspectRatio: '16 / 9',
    },
    overlayStyle: {
      top: '36.6%',
      left: '26.5%',
      width: '47%',
      height: '26.8%',
      aspectRatio: '630 / 360',
      borderRadius: '2%',
    },
  },
  editor: {
    canvasWidth: 630,
    canvasHeight: 360,
    title: "Print Hududi (Tashrif Qog'ozi)",
    legend: 'Sahifa maydoni: 630x360 px (3.5" x 2" nisbatda)',
  },
  sidebar: {
    title: "Tashrif Qog'ozi Dizayneri",
    description: "O'z biznes kartangizni yarating.",
    defaultText: "Tashrif qog'ozi matni",
    defaultTextFontSize: 24,
    stickerFontSize: 40,
    stickers: [
      '\u{1F3E2}',
      '\u{1F4DE}',
      '\u{1F91D}',
      '\u{1F4E7}',
      '\u{1F4BC}',
      '\u{1F4CC}',
      '\u{1F4BB}',
      '\u{1F680}',
      '\u{1F3A8}',
      '\u{1F525}',
      '\u{1F389}',
      '\u2728',
    ],
  },
};

export const calendarCustomizerConfig: SingleSurfaceCustomizerConfig = {
  viewer: {
    productImageSrc: '/products/desk-calendar/front.jpg',
    productImageAlt: 'Desk Calendar',
    exportMessage: 'Desk Calendar export composite render bilan ishlaydi.',
    stageStyle: {
      position: 'relative',
      height: '90%',
      maxHeight: '600px',
      aspectRatio: '4 / 3',
    },
    overlayStyle: {
      top: '15.6%',
      left: '7.94%',
      width: '84.12%',
      height: '81.6%',
      aspectRatio: '560 / 400',
      borderRadius: '4px',
    },
  },
  editor: {
    canvasWidth: 560,
    canvasHeight: 400,
    title: 'Print Hududi (Kalendar Sahifasi)',
    legend: 'Sahifa maydoni: 560x400 px',
  },
  sidebar: {
    title: 'Kalendar Dizayneri',
    description: "Kalendar sahifasini o'zingizga moslashtiring.",
    defaultText: 'Tahrirlash uchun bosing',
    defaultTextFontSize: 40,
    stickerFontSize: 60,
    stickers: [
      '\u2B50',
      '\u2764\uFE0F',
      '\u{1F525}',
      '\u2615',
      '\u{1F5D3}',
      '\u{1F4CC}',
      '\u{1F4BB}',
      '\u{1F680}',
      '\u{1F3A8}',
      '\u{1F3B5}',
      '\u{1F389}',
      '\u2728',
    ],
  },
};

export const shopperBagCustomizerConfig: SingleSurfaceCustomizerConfig = {
  viewer: {
    productImageSrc: '/products/shopper_bag/front.jpg',
    productImageAlt: 'Shopper Bag',
    exportMessage: 'Shopper Bag export composite render bilan ishlaydi.',
    stageStyle: {
      position: 'relative',
      width: '90%',
      maxWidth: '800px',
      aspectRatio: '16 / 9',
    },
    overlayStyle: {
      top: '40%',
      left: '29%',
      width: '42%',
      height: '56%',
      aspectRatio: '3 / 4',
      borderRadius: '4px',
    },
  },
  editor: {
    canvasWidth: 600,
    canvasHeight: 800,
    title: 'Print Hududi (Xaridor Xaltasi)',
    legend: 'Sahifa maydoni: 600x800 px (3:4 nisbatda)',
  },
  sidebar: {
    title: 'Xaridor Xaltasi Dizayneri',
    description: "Shopper bag yuzasini o'zingizga moslashtiring.",
    defaultText: 'Shopper bag matni',
    defaultTextFontSize: 28,
    stickerFontSize: 40,
    stickers: [
      '\u{1F6CD}\uFE0F',
      '\u{1F4E6}',
      '\u{1F381}',
      '\u{1F33F}',
      '\u{1F31F}',
      '\u{1F4CC}',
      '\u{1F4A1}',
      '\u{1F680}',
      '\u{1F3A8}',
      '\u{1F525}',
      '\u{1F389}',
      '\u2728',
    ],
  },
};
