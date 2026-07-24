import type { MetadataRoute } from 'next';
import { catalog } from '@/lib/products/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    ...catalog.map(product => ({
      url: `${base}/products/${product.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
