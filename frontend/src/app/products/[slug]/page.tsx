import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getAllSlugs } from '@/lib/products/catalog';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: 'Product not found' };

  return {
    title: `${product.name} — Zazzle Uzbekistan`,
    description: product.description,
  };
}

export default function ProductDetailPage({ params }: PageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  return <ProductDetailClient product={product} />;
}
