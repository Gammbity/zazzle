import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { catalog, getProductBySlug } from '@/lib/products/catalog';
import { formatMoney } from '@/lib/utils';
import AddToCartButton from '@/components/products/AddToCartButton';

export async function generateStaticParams() {
  return catalog.map(p => ({ slug: p.slug }));
}

export const revalidate = 3600;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Mahsulot topilmadi' };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} — Zazzle.uz`,
      description: product.tagline,
      images: [{ url: product.cover, width: 1200, height: 1200, alt: product.name }],
    },
  };
}

export default async function ProductDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <article className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-ink-600">
        <Link href="/mahsulotlar" className="inline-flex items-center gap-1 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Barcha mahsulotlar
        </Link>
        <span className="text-ink-300">/</span>
        <span className="font-medium text-ink-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery product={product} />

        <div className="flex flex-col">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" /> Brauzerda dizayn qilinadi
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-3 text-lg text-ink-600">{product.tagline}</p>

          <div className="mt-6 flex items-baseline gap-3 border-y border-ink-200 py-5">
            <span className="text-3xl font-bold text-ink-900">
              {formatMoney(product.basePrice, product.currency)}
            </span>
            <span className="text-sm font-medium text-ink-500">dan boshlab</span>
          </div>

          <p className="mt-6 text-base text-ink-700">{product.description}</p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {product.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-10 space-y-3">
            <Link
              href={`/dizayn/${product.slug}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:shadow-elevated"
            >
              <Sparkles className="h-4 w-4" /> Dizaynni boshlash
            </Link>
            <AddToCartButton product={product} />
          </div>

          <p className="mt-4 text-xs text-ink-500">
            48 soatda Toshkent bo‘ylab yetkazib berish. Birinchi buyurtmaga 10% chegirma — promokod
            avtomatik qo‘llaniladi.
          </p>
        </div>
      </div>
    </article>
  );
}

function Gallery({ product }: { product: ReturnType<typeof getProductBySlug> & object }) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-card)] border border-ink-200 bg-gradient-to-br from-ink-50 to-white">
        <Image
          src={product.angles[0].src}
          alt={product.angles[0].alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-8"
        />
      </div>
      {product.angles.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {product.angles.map(a => (
            <div
              key={a.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-ink-200 bg-white"
            >
              <Image src={a.src} alt={a.alt} fill sizes="20vw" className="object-contain p-2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
