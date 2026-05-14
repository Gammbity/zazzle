export type ProductCategory = 'mug' | 'pen' | 'tshirt' | 'bag' | 'card' | 'calendar';

export interface ProductAngle {
  id: string;
  src: string;
  alt: string;
}

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ProductCategory;
  basePrice: number;
  currency: 'UZS';
  angles: ProductAngle[];
  cover: string;
  features: string[];
  customizerType: 'cylindrical' | 'cylindrical-pen' | 'tshirt' | 'single-surface';
}

export const catalog: Product[] = [
  {
    slug: 'kruzhka',
    name: 'Krujka',
    tagline: "Sevimli rasm yoki matn bilan har kuni eslang.",
    description:
      "Yuqori sifatli keramika krujka. UV bosma texnologiyasi bilan yorqin ranglar va uzoq xizmat. Mikroto'lqinli pech va idishyuvgich uchun xavfsiz.",
    category: 'mug',
    basePrice: 65000,
    currency: 'UZS',
    cover: '/products/mug/right.jpg',
    angles: [
      { id: 'right', src: '/products/mug/right.jpg', alt: 'Krujka — o‘ng tomon' },
      { id: 'left', src: '/products/mug/left.jpg', alt: 'Krujka — chap tomon' },
      { id: 'back', src: '/products/mug/back.jpg', alt: 'Krujka — orqa tomon' },
    ],
    features: [
      "330 ml hajm",
      "Premium keramika",
      "Idishyuvgich uchun xavfsiz",
      "Mikroto'lqinli pechda ishlatilishi mumkin",
    ],
    customizerType: 'cylindrical',
  },
  {
    slug: 'ruchka',
    name: 'Ruchka',
    tagline: "Korporativ sovg'a uchun mukammal — har bir to'lqida brendingiz.",
    description:
      "Metall korpusli premium ruchka. Lazer bilan o'ymakorlik chidamli va nafis. Korporativ sovg'a, konferensiya yoki shaxsiy ishlatish uchun.",
    category: 'pen',
    basePrice: 35000,
    currency: 'UZS',
    cover: '/products/pen/side.svg',
    angles: [{ id: 'side', src: '/products/pen/side.svg', alt: 'Ruchka — yon ko‘rinish' }],
    features: ['Metall korpus', "Lazer o'ymakorlik", 'Ko‘k siyoh', 'Premium o‘ram'],
    customizerType: 'cylindrical-pen',
  },
  {
    slug: 'futbolka',
    name: 'Futbolka',
    tagline: "100% paxta — qulay, chidamli, sizniki.",
    description:
      "Yumshoq 180 g/m² paxta futbolka. DTG bosma — yuvilganda rangi so'lmaydi. S dan XXL gacha o'lcham.",
    category: 'tshirt',
    basePrice: 120000,
    currency: 'UZS',
    cover: '/products/t-shirt/front.jpg',
    angles: [
      { id: 'front', src: '/products/t-shirt/front.jpg', alt: 'Futbolka — old tomon' },
      { id: 'back', src: '/products/t-shirt/back.jpg', alt: 'Futbolka — orqa tomon' },
      { id: 'on_human', src: '/products/t-shirt/on_human.jpg', alt: 'Futbolka — modelda' },
    ],
    features: ['100% paxta', '180 g/m²', 'DTG bosma', 'S — XXL'],
    customizerType: 'tshirt',
  },
  {
    slug: 'vizitka',
    name: 'Vizitka',
    tagline: 'Birinchi taassurot — mukammal vizitka bilan.',
    description:
      "350 g/m² qog'oz, ikki tomonlama rangli bosma. Mat yoki yaltiroq lak. Minimal 100 dona.",
    category: 'card',
    basePrice: 1500,
    currency: 'UZS',
    cover: '/products/business-card/front.jpg',
    angles: [
      { id: 'front', src: '/products/business-card/front.jpg', alt: 'Vizitka — old tomon' },
    ],
    features: ["350 g/m² qog'oz", 'Ikki tomonlama bosma', 'Mat/yaltiroq lak', 'Min. 100 dona'],
    customizerType: 'single-surface',
  },
  {
    slug: 'sumka',
    name: 'Xarid sumkasi',
    tagline: 'Ekologik tanlov — har kuni siz bilan.',
    description:
      "Kanvas mato sumka. Ekologik, qayta ishlatiladigan. Brendingiz yoki o'z dizayningiz bilan.",
    category: 'bag',
    basePrice: 55000,
    currency: 'UZS',
    cover: '/products/shopper_bag/front.jpg',
    angles: [
      { id: 'front', src: '/products/shopper_bag/front.jpg', alt: 'Sumka — old tomon' },
    ],
    features: ['Kanvas mato', '38x42 sm', 'Uzoq dasta', 'Ekologik'],
    customizerType: 'single-surface',
  },
  {
    slug: 'qog-oz-sumka',
    name: "Qog'oz sumka",
    tagline: "Sovg'a uchun nafis qadoq.",
    description: "Mustahkam kraft qog'oz sumka. Sovg'a yoki butik qadoqi uchun ideal.",
    category: 'bag',
    basePrice: 18000,
    currency: 'UZS',
    cover: '/products/shopper_bag_paper/front.jpg',
    angles: [
      { id: 'front', src: '/products/shopper_bag_paper/front.jpg', alt: "Qog'oz sumka — old tomon" },
    ],
    features: ["Kraft qog'oz", '24x32 sm', 'Mustahkam dasta', "Ko'p marta ishlatish"],
    customizerType: 'single-surface',
  },
  {
    slug: 'stol-kalendari',
    name: 'Stol kalendari',
    tagline: "Yil bo'yi xotirangizda — siz tanlagan rasmlar bilan.",
    description:
      'Stol uchun tasvirli kalendar. 12 oy + muqova. Premium qog\'oz, spiral biriktirma.',
    category: 'calendar',
    basePrice: 85000,
    currency: 'UZS',
    cover: '/products/desk-calendar/on_table.jpg',
    angles: [
      { id: 'on_table', src: '/products/desk-calendar/on_table.jpg', alt: 'Kalendar — stolda' },
      { id: 'front', src: '/products/desk-calendar/front.jpg', alt: 'Kalendar — old' },
    ],
    features: ['12 oy + muqova', '170 g/m² qog\'oz', 'Spiral biriktirma', 'A5 o‘lcham'],
    customizerType: 'single-surface',
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return catalog.find(p => p.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return catalog.filter(p => p.category === category);
}
