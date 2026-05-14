import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <span className="text-7xl font-bold text-brand-600">404</span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
        Sahifa topilmadi
      </h1>
      <p className="mt-3 max-w-md text-ink-600">
        Bu havola eskirgan yoki mavjud emas. Bosh sahifaga qaytib, izlayotganingizni topishingiz
        mumkin.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Bosh sahifaga
      </Link>
    </section>
  );
}
