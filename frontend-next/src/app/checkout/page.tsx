import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Checkout',
  description: "Buyurtmani yakunlash va to'lash.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/savatcha"
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Savatchaga qaytish
      </Link>

      <div className="mt-6 rounded-[var(--radius-card)] border border-ink-200 bg-white p-8 shadow-card sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <CreditCard className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-ink-900">
          Checkout tez orada
        </h1>
        <p className="mx-auto mt-3 max-w-md text-center text-ink-600">
          To‘lov tizimi integratsiyasi (Click, Payme, Uzcard) ulanish jarayonida.
          Buyurtmangizni hozirgina shakllantirishingiz mumkin emas.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {['Click', 'Payme', 'Uzcard', 'Naqd'].map(method => (
            <div
              key={method}
              className="rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-center text-sm font-medium text-ink-700"
            >
              {method}
            </div>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-ink-500">
          <Lock className="h-3.5 w-3.5" /> Karta ma‘lumotlari to‘lov tizimida xavfsiz saqlanadi.
        </p>
      </div>
    </section>
  );
}
