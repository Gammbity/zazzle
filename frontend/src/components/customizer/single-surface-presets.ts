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
    productImageAlt: 'Vizitka',
    exportMessage: 'Vizitka uchun yakuniy birlashtirilgan rasm tayyorlanadi.',
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
    title: 'Bosma hududi (vizitka)',
    legend: 'Sahifa maydoni: 630x360 px (3.5" x 2" nisbatda)',
  },
  sidebar: {
    title: 'Vizitka dizayneri',
    description: "O'z vizitkangizni yarating.",
    defaultText: 'Vizitka matni',
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
    productImageAlt: 'Stol kalendari',
    exportMessage:
      'Stol kalendari uchun yakuniy birlashtirilgan rasm tayyorlanadi.',
    stageStyle: {
      position: 'relative',
      height: '90%',
      maxHeight: '600px',
      aspectRatio: '4 / 3',
    },
    overlayStyle: {
      top: '18%',
      left: '11.5%',
      width: '77%',
      height: '67%',
      aspectRatio: '560 / 400',
      borderRadius: '4px',
    },
  },
  editor: {
    canvasWidth: 560,
    canvasHeight: 400,
    title: 'Bosma hududi (kalendar sahifasi)',
    legend: 'Sahifa maydoni: 560x400 px',
  },
  sidebar: {
    title: 'Kalendar dizayneri',
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
    productImageAlt: 'Xarid sumkasi',
    exportMessage:
      'Xarid sumkasi uchun yakuniy birlashtirilgan rasm tayyorlanadi.',
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
    title: 'Bosma hududi (xarid sumkasi)',
    legend: 'Sahifa maydoni: 600x800 px (3:4 nisbatda)',
  },
  sidebar: {
    title: 'Xarid sumkasi dizayneri',
    description: "Xarid sumkasi yuzasini o'zingizga moslashtiring.",
    defaultText: 'Xarid sumkasi matni',
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
