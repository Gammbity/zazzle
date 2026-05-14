import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Palette, Package, ShoppingCart, Truck, Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Qanday ishlaydi',
  description:
    "Zazzle.uz'da buyurtma 4 qadamda: mahsulot tanlash, dizayn qilish, to'lash va uyga olish.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      icon: Package,
      title: 'Mahsulot tanlang',
      body: 'Krujka, ruchka, futbolka, vizitka, sumka, kalendar — 7 ta kategoriyadan birini tanlang. Har biri uchun moslangan dizayner.',
    },
    {
      num: '02',
      icon: Palette,
      title: 'Brauzerda dizayn qiling',
      body: 'Matn, rasm, stiker qo‘shing. Har bir o‘zgarishni 2D va 3D preview’da darhol ko‘ring. Ilova o‘rnatish shart emas.',
    },
    {
      num: '03',
      icon: ShoppingCart,
      title: 'Savatchaga qo‘shing',
      body: 'Bir nechta mahsulotni birga buyurtma bering. Promokod yoki referral bilan chegirma oling.',
    },
    {
      num: '04',
      icon: Wallet,
      title: 'To‘lov qiling',
      body: 'Click, Payme, Uzcard, Humo — yoki yetkazib berishda naqd to‘lang. Karta ma’lumotlari saqlanmaydi.',
    },
    {
      num: '05',
      icon: Truck,
      title: 'Qabul qiling',
      body: 'Toshkent bo‘ylab 48 soatda, regionlarga 3–5 kunda yetkazib beriladi. Real-vaqt holat kuzatuv.',
    },
  ];

  return (
    <>
      <section className="border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold text-brand-700">Qanday ishlaydi</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            5 qadam — sizning mahsulotingiz
          </h1>
          <p className="mt-4 text-lg text-ink-600">
            Tanlang → Yarating → Buyurtma bering. 48 soat ichida uyingizgacha yetib boradi.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <ol className="space-y-6">
            {steps.map(({ num, icon: Icon, title, body }) => (
              <li
                key={num}
                className="flex gap-6 rounded-[var(--radius-card)] border border-ink-200 bg-gradient-to-br from-white to-ink-50 p-6 shadow-soft sm:p-8"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl font-bold text-brand-600">{num}</span>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
                  <p className="mt-2 text-ink-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex justify-center">
            <Link
              href="/mahsulotlar"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
            >
              Hozir boshlash <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
