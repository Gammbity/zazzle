import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Boxes,
  CreditCard,
  PackageSearch,
  Wallet,
} from 'lucide-react';
import CommerceAuthModal from '@/components/commerce/CommerceAuthModal';
import {
  formatMoney,
  getOrderStats,
  getOrders,
  getOrderStatusMeta,
  isAuthenticated,
  type CommerceOrderStats,
  type CommerceOrderSummary,
} from '@/lib/commerce';
import { Link } from '@/lib/router';

export default function OrdersPage() {
  const [orders, setOrders] = useState<CommerceOrderSummary[]>([]);
  const [stats, setStats] = useState<CommerceOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      setOrders([]);
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        getOrders(),
        getOrderStats(),
      ]);
      setOrders(ordersResponse);
      setStats(statsResponse);
    } catch {
      setError('Buyurtmalarni yuklashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <>
      <main className='min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_22%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_40%,_#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='rounded-[2.2rem] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/60 backdrop-blur sm:p-8'>
            <p className='text-sm font-semibold uppercase tracking-[0.3em] text-sky-700'>
              Buyurtmalar
            </p>
            <h1 className='mt-3 text-4xl font-semibold text-slate-950'>
              Buyurtmalar tarixi
            </h1>
            <p className='mt-3 max-w-3xl text-base leading-7 text-slate-600'>
              Checkoutdan keyingi barcha orderlar, ularning holati va umumiy
              sarf shu bo&apos;limda ko&apos;rinadi.
            </p>
          </div>

          {loading ? (
            <div className='mt-8 h-72 animate-pulse rounded-[2rem] bg-slate-100' />
          ) : !isAuthenticated() ? (
            <div className='mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60'>
              <h2 className='text-3xl font-semibold text-slate-900'>
                Buyurtmalar hisob bilan bog&apos;langan
              </h2>
              <p className='mt-3 text-base leading-7 text-slate-600'>
                Orderlar tarixini ko&apos;rish uchun hisobga kiring.
              </p>
              <button
                type='button'
                onClick={() => setAuthOpen(true)}
                className='mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
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

              {stats && (
                <div className='mt-8 grid gap-4 md:grid-cols-4'>
                  <div className='rounded-[1.6rem] bg-slate-950 p-5 text-white shadow-lg shadow-slate-900/10'>
                    <div className='flex items-center gap-3'>
                      <Boxes className='h-5 w-5 text-sky-300' />
                      <span className='text-sm text-slate-300'>
                        Jami buyurtma
                      </span>
                    </div>
                    <p className='mt-4 text-3xl font-semibold'>
                      {stats.total_orders}
                    </p>
                  </div>
                  <div className='rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60'>
                    <div className='flex items-center gap-3'>
                      <CreditCard className='h-5 w-5 text-amber-600' />
                      <span className='text-sm text-slate-500'>
                        To&apos;lov kutilmoqda
                      </span>
                    </div>
                    <p className='mt-4 text-3xl font-semibold text-slate-950'>
                      {stats.payment_pending_orders}
                    </p>
                  </div>
                  <div className='rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60'>
                    <div className='flex items-center gap-3'>
                      <PackageSearch className='h-5 w-5 text-sky-700' />
                      <span className='text-sm text-slate-500'>
                        Ishlab chiqarishda
                      </span>
                    </div>
                    <p className='mt-4 text-3xl font-semibold text-slate-950'>
                      {stats.in_production_orders}
                    </p>
                  </div>
                  <div className='rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60'>
                    <div className='flex items-center gap-3'>
                      <Wallet className='h-5 w-5 text-emerald-700' />
                      <span className='text-sm text-slate-500'>
                        Umumiy sarf
                      </span>
                    </div>
                    <p className='mt-4 text-2xl font-semibold text-slate-950'>
                      {formatMoney(stats.total_spent || 0)}
                    </p>
                  </div>
                </div>
              )}

              {orders.length === 0 ? (
                <div className='mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-200/50'>
                  <h2 className='text-3xl font-semibold text-slate-900'>
                    Hali buyurtma yo&apos;q
                  </h2>
                  <p className='mt-3 text-base leading-7 text-slate-600'>
                    Mahsulot sahifasida dizaynni tayyorlab savatga
                    qo&apos;shing, so&apos;ng checkoutdan order yarating.
                  </p>
                  <Link
                    to='/'
                    className='mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
                  >
                    Mahsulotlarni ko&apos;rish
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                </div>
              ) : (
                <div className='mt-8 grid gap-4'>
                  {orders.map(order => {
                    const status = getOrderStatusMeta(order.status);

                    return (
                      <article
                        key={order.order_number}
                        className='rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50'
                      >
                        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                          <div>
                            <div className='flex flex-wrap items-center gap-3'>
                              <h2 className='text-2xl font-semibold text-slate-950'>
                                {order.order_number}
                              </h2>
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            <p className='mt-2 text-sm text-slate-500'>
                              {new Date(order.created_at).toLocaleString(
                                'uz-UZ'
                              )}
                            </p>
                          </div>

                          <div className='grid gap-3 sm:grid-cols-3'>
                            <div className='rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                              <p className='text-xs uppercase tracking-[0.16em] text-slate-400'>
                                Elementlar
                              </p>
                              <p className='mt-2 text-lg font-semibold text-slate-900'>
                                {order.item_count}
                              </p>
                            </div>
                            <div className='rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                              <p className='text-xs uppercase tracking-[0.16em] text-slate-400'>
                                Jami
                              </p>
                              <p className='mt-2 text-lg font-semibold text-slate-900'>
                                {formatMoney(order.total_amount)}
                              </p>
                            </div>
                            <Link
                              to={`/orders/${order.order_number}`}
                              className='inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
                            >
                              Tafsilotlar
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
          void loadOrders();
        }}
      />
    </>
  );
}
