import { ArrowRight, Package } from 'lucide-react';
import { useAdminProducts } from '@/hooks/queries';
import { Link } from '@/lib/router';

export default function AdminProductsListPage() {
  const productsQuery = useAdminProducts();
  const data = productsQuery.data;
  const products = data ? (Array.isArray(data) ? data : data.results) : [];

  return (
    <div>
      <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
        Admin
      </p>
      <h1 className='mt-2 text-3xl font-semibold text-slate-950'>
        Mahsulotlar
      </h1>
      <p className='mt-2 max-w-2xl text-base leading-7 text-slate-500'>
        Mahsulot turlari va ularning variantlarini boshqaring.
      </p>

      {productsQuery.isLoading ? (
        <div className='mt-8 h-64 animate-pulse rounded-[2rem] bg-amber-50' />
      ) : products.length === 0 ? (
        <div className='mt-8 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
          <p className='text-base text-slate-600'>Mahsulot topilmadi.</p>
        </div>
      ) : (
        <div className='mt-6 grid gap-3'>
          {products.map(product => (
            <article
              key={product.id}
              className='rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50 transition hover:border-amber-200 hover:shadow-amber-100/40'
            >
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700'>
                    <Package className='h-4 w-4' />
                  </div>
                  <div>
                    <div className='flex flex-wrap items-center gap-2.5'>
                      <h2 className='text-lg font-semibold text-slate-950'>
                        {product.name}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          product.is_active
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                            : 'border-slate-200 bg-slate-100 text-slate-600'
                        }`}
                      >
                        {product.is_active ? 'Faol' : 'Faol emas'}
                      </span>
                    </div>
                    <p className='mt-1 text-sm text-slate-500'>
                      {product.variant_count ?? product.variants?.length ?? 0}{' '}
                      ta variant
                    </p>
                  </div>
                </div>

                <Link
                  to={`/admin/products/${product.id}`}
                  className='inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700'
                >
                  Tahrirlash
                  <ArrowRight className='h-3.5 w-3.5' />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
