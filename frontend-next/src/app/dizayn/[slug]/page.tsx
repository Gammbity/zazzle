import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { catalog, getProductBySlug } from '@/lib/products/catalog';
import DesignerShell from './DesignerShell';

export async function generateStaticParams() {
  return catalog.map(p => ({ slug: p.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Mahsulot topilmadi' };
  return {
    title: `${product.name} — dizayner`,
    description: `${product.name} uchun o'z dizayningizni yarating.`,
    robots: { index: false, follow: false },
  };
}

export default async function DesignerPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  return <DesignerShell product={product} />;
}
