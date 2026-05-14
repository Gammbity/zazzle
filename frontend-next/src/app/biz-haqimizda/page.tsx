import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Heart, MapPin, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Biz haqimizda',
  description:
    "Zazzle.uz — O'zbekistondagi birinchi print-on-demand platforma. Mahalliy dizaynerlarni qo'llab-quvvatlash, sifatli mahsulotlar.",
};

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold text-brand-700">Biz haqimizda</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            O‘zbekistonni birinchi print-on-demand platformasi
          </h1>
          <p className="mt-4 text-lg text-ink-600">
            Biz ijodkorlik, mahalliy ishlab chiqarish va texnologiyalarni birlashtiramiz.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink-900">Bizning maqsad</h2>
            <p className="mt-4 text-ink-700">
              Har bir o‘zbekistonlik o‘z ijodini real mahsulotda ko‘rishi mumkin bo‘lsin.
              Krujkangizda nabirangiz rasmi, futbolkangizda sevimli iborangiz, vizitkangizda
              o‘ziga xos brendingiz.
            </p>
            <p className="mt-3 text-ink-700">
              Biz hech qachon dizayn ham, mahsulot ham minimal partiyada cheklamaymiz — bittadan ham
              buyurtma berishingiz mumkin.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-ink-900">Mahalliy ishlab chiqarish</h2>
            <p className="mt-4 text-ink-700">
              Barcha bosma ishlari Toshkentdagi o‘z sexlarimizda amalga oshiriladi.
              Mahalliy ishchi o‘rinlar, qisqa yetkazib berish vaqti, mahalliy iqtisodga qo‘shilgan
              hissa.
            </p>
            <p className="mt-3 text-ink-700">
              Sex jihozlari — Yevropa va Janubiy Koreya brendlari, ranglar Pantone standartiga
              moslashtirilgan.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-200 bg-ink-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">Bizning qadriyatlar</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Heart, title: 'Sifat', body: 'Premium materiallar, har bir buyurtma alohida tekshiruvdan o‘tadi.' },
              { icon: Users, title: 'Mahalliy jamoa', body: '15+ dizayner va ustalar bilan ishlaymiz.' },
              { icon: MapPin, title: "Butun O'zbekiston", body: "Toshkentdan Termizgacha — har bir viloyatga yetkazamiz." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[var(--radius-card)] border border-ink-200 bg-white p-6 shadow-soft">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm text-ink-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">Birgalikda yaratamiz</h2>
          <p className="max-w-2xl text-ink-600">
            Dizaynersiz? Bizning mahalliy dizaynerlar marketplace’imizdan tayyor variantlarni
            tanlang. O‘zingiz dizayner bo‘lsangiz — bizga qo‘shiling va royalty oling.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/mahsulotlar"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
            >
              Mahsulotlar <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dizaynerlar"
              className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition hover:border-ink-400 hover:bg-ink-50"
            >
              Dizaynerlar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
