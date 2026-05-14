import type { Metadata } from 'next';
import ProductCard from '@/components/products/ProductCard';
import { catalog } from '@/lib/products/catalog';

export const metadata: Metadata = {
  title: 'Mahsulotlar',
  description: "Krujka, ruchka, futbolka, vizitka, sumka, kalendar — o'z dizayningiz bilan buyurtma bering.",
};

export default function ProductsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-brand-700">Katalog</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          Barcha mahsulotlar
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ink-600">
          Tanlang, dizayn qiling, qabul qiling. Har bir mahsulot uchun maxsus dizayner brauzeringizda
          ishlaydi — ilova o‘rnatish shart emas.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {catalog.map((p, idx) => (
          <ProductCard key={p.slug} product={p} priority={idx < 4} />
        ))}
      </div>
    </section>
  );
}
