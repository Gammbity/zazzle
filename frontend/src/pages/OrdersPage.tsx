import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Boxes,
  CreditCard,
  PackageSearch,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import CommerceAuthModal from '@/components/commerce/CommerceAuthModal';
import { useOrders, useOrderStats } from '@/hooks/queries';
import {
  formatMoney,
  getOrderStatusMeta,
  isAuthenticated,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';
import { Link } from '@/lib/router';

export default function OrdersPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const queryClient = useQueryClient();

  const ordersQuery = useOrders();
  const statsQuery = useOrderStats();

  const orders = ordersQuery.data ?? [];
  const stats = statsQuery.data ?? null;
  const loading = ordersQuery.isLoading || statsQuery.isLoading;
  const error =
    ordersQuery.isError || statsQuery.isError
      ? 'Buyurtmalarni yuklashda xatolik yuz berdi.'
      : null;

  return (
    <>
      <main className='min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_22%),linear-gradient(180deg,_#fffbeb_0%,_#ffffff_40%,_#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {/* Header */}
          <div className='rounded-[2.2rem] border border-amber-100 bg-white/90 p-6 shadow-sm shadow-amber-100/40 backdrop-blur sm:p-8'>
            <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
              Buyurtmalar
            </p>
            <h1 className='mt-2 text-3xl font-semibold text-slate-950'>
              Buyurtmalar tarixi
            </h1>
            <p className='mt-2 max-w-2xl text-base leading-7 text-slate-500'>
              Checkoutdan keyingi barcha orderlar va ularning holatlari.
            </p>
          </div>

          {loading ? (
            <div className='mt-8 h-64 animate-pulse rounded-[2rem] bg-amber-50' />
          ) : !isAuthenticated() ? (
            <div className='mt-8 rounded-[2rem] border border-amber-100 bg-white p-8 text-center shadow-sm shadow-amber-100/40'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-700'>
                <ShoppingBag className='h-7 w-7' />
              </div>
              <h2 className='mt-5 text-2xl font-semibold text-slate-900'>
                Buyurtmalar hisob bilan bog&apos;langan
              </h2>
              <p className='mt-3 text-base leading-7 text-slate-600'>
                Orderlar tarixini ko&apos;rish uchun hisobga kiring.
              </p>
              <button
                type='button'
                onClick={() => setAuthOpen(true)}
                className='mt-6 rounded-2xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700'
              >
                Hisobga kirish
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className='mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                  {error}
                </div>
              )}

              {/* Stats */}
              {stats && (
                <div className='mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4'>
                  <div className='rounded-[1.6rem] bg-gradient-to-br from-amber-700 to-orange-800 p-5 text-white shadow-lg shadow-amber-900/20'>
                    <div className='flex items-center gap-2.5'>
                      <Boxes className='h-4 w-4 text-amber-200' />
                      <span className='text-xs text-amber-200'>Jami buyurtma</span>
                    </div>
                    <p className='mt-3 text-3xl font-semibold'>
                      {stats.total_orders}
                    </p>
                  </div>
                  <div className='rounded-[1.6rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50'>
                    <div className='flex items-center gap-2.5'>
                      <CreditCard className='h-4 w-4 text-amber-600' />
                      <span className='text-xs text-slate-500'>To&apos;lov kutilmoqda</span>
                    </div>
                    <p className='mt-3 text-3xl font-semibold text-slate-950'>
                      {stats.payment_pending_orders}
                    </p>
                  </div>
                  <div className='rounded-[1.6rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50'>
                    <div className='flex items-center gap-2.5'>
                      <PackageSearch className='h-4 w-4 text-amber-600' />
                      <span className='text-xs text-slate-500'>Ishlab chiqarishda</span>
                    </div>
                    <p className='mt-3 text-3xl font-semibold text-slate-950'>
                      {stats.in_production_orders}
                    </p>
                  </div>
                  <div className='rounded-[1.6rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50'>
                    <div className='flex items-center gap-2.5'>
                      <Wallet className='h-4 w-4 text-emerald-600' />
                      <span className='text-xs text-slate-500'>Umumiy sarf</span>
                    </div>
                    <p className='mt-3 text-xl font-semibold text-slate-950'>
                      {formatMoney(stats.total_spent || 0)}
                    </p>
                  </div>
                </div>
              )}

              {orders.length === 0 ? (
                <div className='mt-8 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
                  <h2 className='text-2xl font-semibold text-slate-900'>
                    Hali buyurtma yo&apos;q
                  </h2>
                  <p className='mt-3 text-base leading-7 text-slate-600'>
                    Mahsulot sahifasida dizaynni tayyorlab savatga qo&apos;shing.
                  </p>
                  <Link
                    to='/'
                    className='mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700'
                  >
                    Mahsulotlarni ko&apos;rish
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                </div>
              ) : (
                <div className='mt-6 grid gap-3'>
                  {orders.map(order => {
                    const status = getOrderStatusMeta(order.status);

                    return (
                      <article
                        key={order.order_number}
                        className='rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50 transition hover:border-amber-200 hover:shadow-amber-100/40'
                      >
                        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                          <div>
                            <div className='flex flex-wrap items-center gap-2.5'>
                              <h2 className='text-lg font-semibold text-slate-950'>
                                {order.order_number}
                              </h2>
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            <p className='mt-1.5 text-sm text-slate-500'>
                              {new Date(order.created_at).toLocaleString('uz-UZ')}
                            </p>
                          </div>

                          <div className='flex items-center gap-3'>
                            <div className='rounded-2xl bg-stone-50 px-4 py-2.5 text-center'>
                              <p className='text-xs text-slate-400'>Mahsulot</p>
                              <p className='mt-0.5 font-semibold text-slate-900'>
                                {order.item_count}
                              </p>
                            </div>
                            <div className='rounded-2xl bg-amber-50 px-4 py-2.5 text-center'>
                              <p className='text-xs text-slate-400'>Jami</p>
                              <p className='mt-0.5 font-semibold text-slate-900'>
                                {formatMoney(order.total_amount)}
                              </p>
                            </div>
                            <Link
                              to={`/orders/${order.order_number}`}
                              className='inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700'
                            >
                              Tafsilotlar
                              <ArrowRight className='h-3.5 w-3.5' />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <CommerceAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        }}
      />
    </>
  );
}
