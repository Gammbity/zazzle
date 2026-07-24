import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductCustomizer from '@/features/products/ProductCustomizer';
import { catalog, getProductBySlug } from '@/lib/products/catalog';

export function generateStaticParams() {
  return catalog.map(product => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) return { title: 'Mahsulot topilmadi' };

  return {
    title: `${product.name} dizayni`,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} dizayni | Zazzle Uzbekistan`,
      description: product.description,
      images: [{ url: product.thumbnail, alt: product.name }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return <ProductCustomizer product={product} />;
}
