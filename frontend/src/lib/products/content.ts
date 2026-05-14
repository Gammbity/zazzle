import type { Product } from '@/lib/products/catalog';

export type ProductFilterId =
  | 'all'
  | 'popular'
  | 'gift'
  | 'business'
  | 'office';

export interface ProductUiContent {
  categoryId: Exclude<ProductFilterId, 'all'>;
  categoryLabel: string;
  shortTagline: string;
  summary: string;
  turnaround: string;
  badge?: string;
  ctaLabel: string;
  features: string[];
  idealFor: string[];
  trustPoints: string[];
  steps: string[];
}

export const PRODUCT_FILTERS: {
  id: ProductFilterId;
  label: string;
  description: string;
}[] = [
  {
    id: 'all',
    label: 'Barchasi',
    description: 'Barcha mahsulotlar',
  },
  {
    id: 'popular',
    label: 'Tez tayyor',
    description: 'Eng tez va ommabop variantlar',
  },
  {
    id: 'gift',
    label: 'Sovga uchun',
    description: 'Sovga va shaxsiy buyurtmalar uchun mos',
  },
  {
    id: 'business',
    label: 'Biznes',
    description: 'Brend va ishbilarmonlik ehtiyojlari uchun',
  },
  {
    id: 'office',
    label: 'Ofis',
    description: 'Ofis va stol usti mahsulotlari',
  },
];

const PRODUCT_CONTENT: Record<string, ProductUiContent> = {
  't-shirt': {
    categoryId: 'popular',
    categoryLabel: 'Kiyim',
    shortTagline: 'Logo, event va shaxsiy uslub uchun eng qulay tanlov.',
    summary:
      "Futbolka dizaynini bir necha daqiqada tayyorlang. Rasm, matn va stiker qo'shib jonli ko'rinish orqali natijani darhol ko'rasiz.",
    turnaround: '1-2 ish kuni',
    badge: "Eng ko'p tanlanadi",
    ctaLabel: 'Futbolkani dizayn qilish',
    features: [
      'Old va orqa tomonga mos yuzalar',
      'Paxtali kundalik kiyim',
      'Brend merch va event uchun qulay',
    ],
    idealFor: ['Jamoa kiyimi', 'Sovga', 'Brend merch'],
    trustPoints: [
      'Dizayn avtomatik saqlanadi',
      "Print zonasi ko'rinib turadi",
      'Telefon va desktopda qulay ishlaydi',
    ],
    steps: ['Rasm yuklang', "Matn qo'shing", "Ko'rinishni tekshiring"],
  },
  mug: {
    categoryId: 'gift',
    categoryLabel: 'Sovga',
    shortTagline: "Tez tayyor bo'ladigan, doim kerak bo'ladigan sovga.",
    summary:
      "Krujka uchun dizayn tayyorlashda oddiy ko'rinish ham, haqiqatga yaqin ko'rinish ham mavjud. Bosma qanday joylashishini oldindan baholash oson.",
    turnaround: '1-2 ish kuni',
    badge: "Sovga uchun zo'r",
    ctaLabel: 'Krujkani dizayn qilish',
    features: [
      "Haqiqatga yaqin krujka ko'rinishi",
      'Yozuv va logo uchun mos',
      'Ofis va sovga buyurtmalarida mashhur',
    ],
    idealFor: ['Korporativ sovga', 'Shaxsiy sovga', 'Ofis uchun'],
    trustPoints: [
      "Haqiqatga yaqin ko'rinish yuklab olinadi",
      'Print fayli alohida saqlanadi',
      'Chegaralar ichida joylashish nazorat qilinadi',
    ],
    steps: [
      "Dizayn qo'shing",
      "Aylana ko'rinishini tekshiring",
      'Faylni yuklab oling',
    ],
  },
  'business-card': {
    categoryId: 'business',
    categoryLabel: 'Biznes',
    shortTagline: "Uchrashuv va networking uchun professional ko'rinish.",
    summary:
      "Vizitka maketini tez tayyorlang, matn va logoni joylashtiring, keyin chop etishga tayyor variantni ko'rib chiqing.",
    turnaround: '1-3 ish kuni',
    badge: 'Biznes uchun',
    ctaLabel: 'Vizitkani dizayn qilish',
    features: [
      'Minimal va toza maketlar uchun qulay',
      'Matn tahriri tez ishlaydi',
      "Ikki tomonlama ko'rinish uchun tayyor",
    ],
    idealFor: ['Kompaniya kartasi', 'Freelancer vizitkasi', 'Tadbirlar'],
    trustPoints: [
      "Matnni tez o'zgartirish mumkin",
      'Element qatlamlari boshqariladi',
      "Aniq chop zonasi ko'rsatiladi",
    ],
    steps: [
      'Brend matnini kiriting',
      'Kontaktlarni tekshiring',
      "Yakuniy ko'rinishni saqlang",
    ],
  },
  'desk-calendar': {
    categoryId: 'office',
    categoryLabel: 'Ofis',
    shortTagline: 'Brend esdaligi yoki stol usti sovgasi uchun amaliy variant.',
    summary:
      "Stol kalendari dizayni foto, logo yoki aksiyani namoyish qilish uchun mos. Keng ko'rinish maydoni sabab joylashuvni tez tekshirish mumkin.",
    turnaround: '2-3 ish kuni',
    badge: 'Ofis uchun',
    ctaLabel: 'Taqvimni dizayn qilish',
    features: [
      "Keng ko'rinish maydoni",
      'Ofis va promo sovgalar uchun mos',
      "Yil davomida ko'rinib turadigan format",
    ],
    idealFor: ['Ofis aksessuari', 'Promo sovga', 'Brend stoli'],
    trustPoints: [
      'Katta dizayn hududi bilan ishlash oson',
      "Ko'rinish darhol yangilanadi",
      'Katta rasmlar markazga avtomatik joylashadi',
    ],
    steps: [
      'Rasm joylang',
      "Matn va logo qo'shing",
      "Stol usti ko'rinishini tekshiring",
    ],
  },
  pen: {
    categoryId: 'business',
    categoryLabel: 'Brend',
    shortTagline:
      "Logo va nomni oq, minimal promo ruchkada 3D ko'rinishda namoyish qiling.",
    summary:
      "Ruchka sahifasida 3D/360 preview ishlaydi. Dizayn barrel bo'ylab o'ralib chiqadi va foydalanuvchi ruchkani aylantirib har tomondan tekshira oladi.",
    turnaround: '1-2 ish kuni',
    badge: 'Brend uchun',
    ctaLabel: 'Ruchkani dizayn qilish',
    features: [
      '3D va 360 daraja aylanma preview',
      'Logo va qisqa brend nomi uchun qulay',
      'Korporativ sovga va promo uchun mos',
    ],
    idealFor: ["Promo to'plam", 'Korporativ sovga', "Ko'rgazma stendi"],
    trustPoints: [
      "Brend nomi barrel bo'ylab oldindan ko'rinadi",
      "3D ko'rinishni PNG sifatida saqlash mumkin",
      'Dizaynlar refreshdan keyin ham saqlanadi',
    ],
    steps: [
      "Logo yoki matn qo'ying",
      "3D/360 ko'rinishni tekshiring",
      'Yakuniy faylni saqlang',
    ],
  },
};

export const HOME_STEPS = [
  {
    title: '1. Mahsulotni tanlang',
    description:
      'Kerakli formatni toping: futbolka, mug, ruchka, vizitka yoki stol taqvimi.',
  },
  {
    title: '2. Dizaynni tayyorlang',
    description:
      "Rasm yuklang, matn yozing va qatlamlarni kerakli joyga qo'ying.",
  },
  {
    title: "3. Ko'rinishni tekshiring",
    description:
      "Jonli ko'rinish orqali natijani ko'rib, keyin chop etishga tayyorlang.",
  },
];

export const HOME_BENEFITS = [
  {
    title: 'Tez tushuniladi',
    description:
      "Murakkab menyular o'rniga aniq tugmalar va qadamma-qadam yo'l-yo'riq beriladi.",
  },
  {
    title: 'Avtomatik saqlanadi',
    description:
      "Dizayn jarayonida qilgan o'zgarishlaringiz brauzerda saqlanib boradi.",
  },
  {
    title: "Buyurtmaga yaqin ko'rinish",
    description:
      "Mahsulot sahifasida dizayn qayerga tushishini oldindan ko'rib baholaysiz.",
  },
];

export function getProductUiContent(
  product: Pick<Product, 'slug' | 'tagline' | 'description'>
): ProductUiContent {
  const content = PRODUCT_CONTENT[product.slug];

  if (content) {
    return content;
  }

  return {
    categoryId: 'popular',
    categoryLabel: 'Mahsulot',
    shortTagline: product.tagline,
    summary: product.description,
    turnaround: '1-3 ish kuni',
    ctaLabel: 'Dizaynni ochish',
    features: ["Jonli ko'rinish", 'Qulay muharrir', 'Tez tayyorlash'],
    idealFor: ['Shaxsiy buyurtma', 'Sovga', 'Brend'],
    trustPoints: [
      "Dizaynni oldindan ko'rib chiqasiz",
      'Oson tahrirlash mavjud',
      'Qatlamlar bilan ishlash mumkin',
    ],
    steps: ['Mahsulotni tanlang', 'Dizaynni tayyorlang', "Ko'rinishni saqlang"],
  };
}
