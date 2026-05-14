'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Layers, Redo2, Save, Smile, Sparkles, Type, Undo2 } from 'lucide-react';
import type { Product } from '@/lib/products/catalog';
import { formatMoney } from '@/lib/utils';

interface Props {
  product: Product;
}

export default function DesignerShell({ product }: Props) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 bg-ink-100 lg:grid-cols-[280px_1fr_320px]">
      {/* Tools sidebar */}
      <aside className="hidden border-r border-ink-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-ink-200 p-4">
          <Link
            href={`/mahsulotlar/${product.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Mahsulotga qaytish
          </Link>
          <h2 className="mt-3 text-lg font-bold text-ink-900">{product.name}</h2>
          <p className="text-xs text-ink-500">Dizayner</p>
        </div>

        <nav className="grid gap-1 p-3">
          <ToolButton icon={Type} label="Matn qo'shish" />
          <ToolButton icon={ImagePlus} label="Rasm yuklash" />
          <ToolButton icon={Smile} label="Stikerlar" />
          <ToolButton icon={Layers} label="Qatlamlar" />
        </nav>

        <div className="mt-auto border-t border-ink-200 p-4">
          <p className="text-xs text-ink-500">Avtomatik saqlash yoqilgan</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Saqlandi
          </p>
        </div>
      </aside>

      {/* Canvas area */}
      <main className="flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              aria-label="Orqaga"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              aria-label="Oldinga"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm font-medium text-ink-600">
            <span className="hidden sm:inline">Bosma maydoni:</span> 100% zoom
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink-800">
            <Save className="h-3.5 w-3.5" /> Saqlash
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="relative aspect-square w-full max-w-2xl overflow-hidden rounded-[var(--radius-card)] border-2 border-dashed border-ink-300 bg-white shadow-elevated">
            <Image
              src={product.angles[0].src}
              alt={product.angles[0].alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain p-12"
            />
            <div className="pointer-events-none absolute inset-12 rounded-2xl border-2 border-dashed border-brand-400/50 bg-brand-50/20" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-medium text-ink-700 shadow-card">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                Canvas tez orada bu yerga keladi (fabric.js + Konva)
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Right panel */}
      <aside className="hidden border-l border-ink-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-ink-200 p-4">
          <h3 className="text-sm font-semibold text-ink-900">Buyurtma</h3>
        </div>
        <div className="flex-1 space-y-4 p-4">
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
            <p className="text-xs text-ink-500">Asosiy narx</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">
              {formatMoney(product.basePrice, product.currency)}
            </p>
          </div>
          <ul className="space-y-2 text-sm text-ink-700">
            {product.features.map(f => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-ink-200 p-4">
          <button
            disabled
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white opacity-60 shadow-card"
            title="Dizaynni tugatgandan keyin"
          >
            Savatchaga qo‘shish
          </button>
          <p className="mt-2 text-center text-xs text-ink-500">Avval dizaynni tugating</p>
        </div>
      </aside>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-700">
      <Icon className="h-5 w-5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
