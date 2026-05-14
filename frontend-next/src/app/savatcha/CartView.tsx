'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { formatMoney } from '@/lib/utils';

export default function CartView() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore(s => s.items);
  const totalAmount = useCartStore(s => s.totalAmount());
  const setQty = useCartStore(s => s.setQty);
  const remove = useCartStore(s => s.remove);
  const clear = useCartStore(s => s.clear);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-32 animate-pulse rounded-2xl bg-ink-100" />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-600">
          <ShoppingBag className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-900">
          Savatcha bo‘sh
        </h1>
        <p className="mt-2 max-w-md text-ink-600">
          Hali hech narsa qo‘shmadingiz. Mahsulotlardan birini tanlang va dizayningiz bilan
          buyurtma bering.
        </p>
        <Link
          href="/mahsulotlar"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
        >
          Mahsulotlarni ko‘rish <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-700">Buyurtma</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Savatcha
          </h1>
        </div>
        <button
          onClick={clear}
          className="text-sm font-medium text-ink-500 hover:text-red-600"
        >
          Hammasini tozalash
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {items.map(item => (
            <li
              key={item.id}
              className="flex gap-4 rounded-[var(--radius-card)] border border-ink-200 bg-white p-4 shadow-soft"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                <Image src={item.cover} alt={item.name} fill sizes="96px" className="object-contain p-2" />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/mahsulotlar/${item.slug}`}
                      className="text-base font-semibold text-ink-900 hover:text-brand-700"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatMoney(item.unitPrice, item.currency)} / dona
                    </p>
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label="O‘chirish"
                    className="grid h-9 w-9 place-items-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <QtyStepper value={item.qty} onChange={v => setQty(item.id, v)} />
                  <span className="text-base font-bold text-ink-900">
                    {formatMoney(item.unitPrice * item.qty, item.currency)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-[var(--radius-card)] border border-ink-200 bg-white p-6 shadow-card lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold text-ink-900">Buyurtma xulosasi</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Mahsulotlar</dt>
              <dd className="font-medium text-ink-900">{formatMoney(totalAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Yetkazib berish</dt>
              <dd className="font-medium text-ink-900">Checkout’da hisoblanadi</dd>
            </div>
          </dl>
          <div className="flex items-baseline justify-between border-t border-ink-200 pt-4">
            <span className="text-sm text-ink-600">Jami</span>
            <span className="text-2xl font-bold text-ink-900">{formatMoney(totalAmount)}</span>
          </div>
          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
          >
            Checkout’ga o‘tish <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-ink-500">
            To‘lov: Click, Payme, Uzcard yoki yetkazib berishda naqd. Birinchi buyurtmaga 10%
            chegirma promokod bilan.
          </p>
        </aside>
      </div>
    </section>
  );
}

function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink-200 bg-white">
      <button
        onClick={() => onChange(value - 1)}
        aria-label="Kamaytirish"
        className="grid h-9 w-9 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold text-ink-900">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        aria-label="Ko‘paytirish"
        className="grid h-9 w-9 place-items-center rounded-full text-ink-700 transition hover:bg-ink-100"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
