import Link from 'next/link';
import { ArrowRight, Palette, Truck, ShieldCheck, Sparkles } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { catalog } from '@/lib/products/catalog';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureStrip />
      <ProductsSection />
      <HowItWorks />
      <CTABand />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-white">
      <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,_black,_transparent_70%)]">
        <div className="absolute left-1/2 top-0 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-brand-200 blur-3xl" />
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-soft">
            <Sparkles className="h-3.5 w-3.5" /> O‘zbekiston #1 print-on-demand
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
            O‘z dizayningiz —<br />
            <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
              hayotingizdagi har bir narsada
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-600">
            Krujka, ruchka, futbolka, vizitka — brauzerda 3 daqiqada dizayn qiling, uyingizgacha
            yetkazib beramiz.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/mahsulotlar"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 hover:shadow-elevated"
            >
              Dizaynni boshlash
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/qanday-ishlaydi"
              className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition hover:border-ink-400 hover:bg-ink-50"
            >
              Qanday ishlaydi?
            </Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-ink-200 pt-6">
            <div>
              <dt className="text-2xl font-bold text-ink-900">10K+</dt>
              <dd className="text-xs text-ink-600">Buyurtma</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-ink-900">48 soat</dt>
              <dd className="text-xs text-ink-600">Yetkazib berish</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-ink-900">4.9 / 5</dt>
              <dd className="text-xs text-ink-600">Mijoz baholash</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -top-6 -right-6 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-4">
            {catalog.slice(0, 4).map((p, idx) => (
              <Link
                key={p.slug}
                href={`/mahsulotlar/${p.slug}`}
                className={`group relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-ink-200 bg-white shadow-card transition hover:shadow-elevated ${idx % 2 === 1 ? 'translate-y-6' : ''}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition group-hover:scale-105"
                  style={{ backgroundImage: `url(${p.cover})` }}
                  aria-hidden
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink-900 shadow-soft backdrop-blur">
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureStrip() {
  const items = [
    { icon: Palette, title: 'Brauzerda dizayn', body: 'Matn, rasm, stiker — barchasi 2D va 3D preview bilan.' },
    { icon: Truck, title: '48 soatda', body: 'Toshkent bo‘ylab tezkor yetkazib berish, regionlarga 3-5 kun.' },
    { icon: ShieldCheck, title: 'Sifat kafolati', body: "Yoqmasa — qaytarib olamiz. Birinchi mijoz uchun 10% chegirma." },
  ];
  return (
    <section className="border-b border-ink-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink-900">{title}</h3>
              <p className="mt-1 text-sm text-ink-600">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section className="border-b border-ink-200 bg-ink-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Mahsulotlar
            </h2>
            <p className="mt-2 max-w-xl text-base text-ink-600">
              7 ta mashhur kategoriya — har biri uchun alohida dizayner.
            </p>
          </div>
          <Link
            href="/mahsulotlar"
            className="hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:inline-flex"
          >
            Barchasi <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {catalog.map((product, idx) => (
            <ProductCard key={product.slug} product={product} priority={idx < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Mahsulot tanlang', body: 'Krujka, futbolka, vizitka — istalganini.' },
    { num: '02', title: 'Dizayn qiling', body: 'Matn, rasm, stiker qo‘shing. 2D va 3D preview.' },
    { num: '03', title: 'Buyurtma bering', body: 'To‘lov: Click, Payme, Uzcard yoki yetkazib berishda.' },
    { num: '04', title: 'Qabul qiling', body: '48 soatda Toshkentda, 3-5 kunda regionlarga.' },
  ];
  return (
    <section className="border-b border-ink-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          4 qadam — sizning mahsulotingiz
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(s => (
            <div
              key={s.num}
              className="relative rounded-[var(--radius-card)] border border-ink-200 bg-gradient-to-br from-white to-ink-50 p-6 shadow-soft"
            >
              <span className="text-3xl font-bold text-brand-600">{s.num}</span>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABand() {
  return (
    <section className="bg-gradient-to-r from-brand-600 to-brand-800 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Birinchi buyurtmangizga 10% chegirma</h2>
          <p className="mt-2 text-brand-100">Hozir dizayn qiling — promokod avtomatik qo‘llaniladi.</p>
        </div>
        <Link
          href="/mahsulotlar"
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-elevated transition hover:bg-brand-50"
        >
          Dizaynni boshlash <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
