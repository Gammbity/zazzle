import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dizaynerlar',
  description: "O'zbekistonlik dizaynerlarning tayyor ishlari. Marketplace tez orada ochiladi.",
};

export default function DesignersPage() {
  return (
    <>
      <section className="border-b border-ink-200 bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold text-brand-700">Marketplace</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            Dizaynerlar
          </h1>
          <p className="mt-4 text-lg text-ink-600">
            O‘zbekistonlik dizaynerlar marketplace’i — har bir dizayn uchun royalty,
            mualliflik huquqi himoyalanadi.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[var(--radius-card)] border border-ink-200 bg-gradient-to-br from-white to-ink-50 p-10 text-center shadow-soft sm:p-14">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Users className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              Marketplace tez orada ochiladi
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-600">
              Hozir biz dizaynerlarni ro‘yxatdan o‘tkazyapmiz. Agar siz dizayner bo‘lsangiz —
              ariza qoldiring, sotuv boshlanganda birinchilardan biri bo‘lasiz.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/dizaynerlar/ariza"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
              >
                <Sparkles className="h-4 w-4" /> Dizayner sifatida ro‘yxatdan o‘tish
              </Link>
              <Link
                href="/blog/dizaynerlar-uchun-qoidalar"
                className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition hover:border-ink-400 hover:bg-ink-50"
              >
                Qoidalar va shartlar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { num: '15%', label: 'Har sotuvdan royalty' },
              { num: '30K+', label: 'Oylik faol xaridor' },
              { num: '0', label: "Ro'yxatdan o'tish to'lovi" },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-[var(--radius-card)] border border-ink-200 bg-white p-6 text-center shadow-soft"
              >
                <div className="text-3xl font-bold text-brand-600">{s.num}</div>
                <div className="mt-2 text-sm text-ink-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
