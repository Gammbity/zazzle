import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  ExternalLink,
  MapPin,
  Truck,
  XCircle,
} from 'lucide-react';
import CommerceAuthModal from '@/components/commerce/CommerceAuthModal';
import { useCancelOrder, useInitPayment, useOrder } from '@/hooks/queries';
import {
  formatMoney,
  getCommerceErrorMessage,
  getOrderStatusMeta,
  isAuthenticated,
  type PaymentInitResult,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';
import { Link } from '@/lib/router';

interface OrderDetailPageProps {
  orderLookup: string;
}

function createIdempotencyKey(orderLookup: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${orderLookup}-${crypto.randomUUID()}`;
  }
  return `${orderLookup}-${Date.now()}`;
}

const PAYMENT_PROVIDERS = [
  { value: 'payme' as const, label: 'Payme' },
  { value: 'click' as const, label: 'Click' },
  { value: 'uzcard_humo' as const, label: 'Uzcard / Humo' },
];

export default function OrderDetailPage({ orderLookup }: OrderDetailPageProps) {
  const queryClient = useQueryClient();
  const [authOpen, setAuthOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentInitResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const orderQuery = useOrder(orderLookup);
  const paymentMutation = useInitPayment();
  const cancelMutation = useCancelOrder();

  const order = orderQuery.data ?? null;
  const loading = orderQuery.isLoading;
  const queryError = orderQuery.isError
    ? "Buyurtma tafsilotlarini yuklab bo'lmadi."
    : null;
  const error = actionError || queryError;

  const statusMeta = useMemo(
    () => getOrderStatusMeta(order?.status || 'NEW'),
    [order?.status]
  );
  const canRetryPayment =
    order?.status === 'NEW' || order?.status === 'PAYMENT_PENDING';
  const paymentBusy = paymentMutation.isPending;
  const cancelBusy = cancelMutation.isPending;

  const handlePaymentInit = async (
    provider: 'payme' | 'click' | 'uzcard_humo'
  ) => {
    if (!order) return;
    setActionError(null);
    try {
      const result = await paymentMutation.mutateAsync({
        orderId: order.id,
        provider,
        idempotencyKey: createIdempotencyKey(order.order_number),
      });
      setPaymentResult(result);
    } catch (paymentError: unknown) {
      setActionError(
        getCommerceErrorMessage(
          paymentError,
          "To'lovni qayta boshlashda xatolik."
        )
      );
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setActionError(null);
    try {
      await cancelMutation.mutateAsync(order.id);
      void orderQuery.refetch();
    } catch {
      setActionError("Buyurtmani bekor qilib bo'lmadi.");
    }
  };

  return (
    <>
      <main className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_20%),linear-gradient(180deg,_#fffbeb_0%,_#ffffff_44%,_#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {/* Back link */}
          <Link
            to='/orders'
            className='inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-50'
          >
            <ArrowLeft className='h-4 w-4' />
            Buyurtmalar ro&apos;yxati
          </Link>

          {loading ? (
            <div className='mt-8 h-64 animate-pulse rounded-[2rem] bg-amber-50' />
          ) : !isAuthenticated() ? (
            <div className='mt-8 rounded-[2rem] border border-amber-100 bg-white p-8 text-center shadow-sm shadow-amber-100/40'>
              <h1 className='text-2xl font-semibold text-slate-900'>
                Buyurtma tafsilotlari uchun kirish talab qilinadi
              </h1>
              <button
                type='button'
                onClick={() => setAuthOpen(true)}
                className='mt-6 rounded-2xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700'
              >
                Hisobga kirish
              </button>
            </div>
          ) : !order ? (
            <div className='mt-8 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
              <h1 className='text-2xl font-semibold text-slate-900'>
                Buyurtma topilmadi
              </h1>
              <p className='mt-3 text-base leading-7 text-slate-600'>
                Order raqamini tekshiring yoki buyurtmalar ro&apos;yxatiga qayting.
              </p>
            </div>
          ) : (
            <>
              {/* Header card */}
              <div className='mt-8 rounded-[2.2rem] border border-amber-100 bg-white/90 p-6 shadow-sm shadow-amber-100/40 backdrop-blur sm:p-8'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
                      Buyurtma tafsiloti
                    </p>
                    <h1 className='mt-2 text-3xl font-semibold text-slate-950'>
                      {order.order_number}
                    </h1>
                    <p className='mt-2 text-sm text-slate-500'>
                      {new Date(order.created_at).toLocaleString('uz-UZ')} da yaratilgan
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              {error && (
                <div className='mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                  {error}
                </div>
              )}

              <div className='mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
                {/* Left: items + shipping */}
                <div className='space-y-6'>
                  {/* Items */}
                  <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
                    <h2 className='text-lg font-semibold text-slate-900'>
                      Buyurtmadagi mahsulotlar
                    </h2>
                    <div className='mt-4 space-y-3'>
                      {order.items.map(item => (
                        <article
                          key={item.id}
                          className='rounded-[1.5rem] border border-stone-100 bg-stone-50/60 p-4'
                        >
                          <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div>
                              <h3 className='font-semibold text-slate-900'>
                                {item.product_name}
                              </h3>
                              <p className='mt-0.5 text-sm text-slate-500'>
                                {item.design_title || 'Dizayn nomi kiritilmagan'}
                              </p>
                              <div className='mt-2 flex flex-wrap gap-3 text-xs text-slate-500'>
                                <span>
                                  Variant:{' '}
                                  {[item.size, item.color]
                                    .filter(Boolean)
                                    .join(' · ') || 'Standart'}
                                </span>
                                <span>Soni: {item.quantity}</span>
                                <span>Bir dona: {formatMoney(item.unit_price)}</span>
                              </div>
                              <p className='mt-1.5 text-xs text-slate-400'>
                                Ishlab chiqarish: {item.production_status}
                              </p>
                            </div>

                            <div className='rounded-2xl bg-amber-50 px-4 py-3 text-right'>
                              <p className='text-xs text-slate-500'>Jami</p>
                              <p className='mt-1 text-lg font-semibold text-slate-900'>
                                {formatMoney(item.total_price)}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  {/* Shipping */}
                  <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
                    <div className='flex items-center gap-2.5'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                        <MapPin className='h-4 w-4' />
                      </div>
                      <h2 className='text-lg font-semibold text-slate-900'>
                        Yetkazib berish
                      </h2>
                    </div>
                    <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                      <div className='rounded-[1.5rem] bg-stone-50 p-4'>
                        <p className='text-xs text-slate-500'>Qabul qiluvchi</p>
                        <p className='mt-1.5 font-semibold text-slate-900'>
                          {order.shipping_name}
                        </p>
                        <p className='mt-0.5 text-sm text-slate-600'>
                          {order.shipping_email}
                        </p>
                        <p className='mt-0.5 text-sm text-slate-600'>
                          {order.shipping_phone || 'Telefon kiritilmagan'}
                        </p>
                      </div>
                      <div className='rounded-[1.5rem] bg-stone-50 p-4'>
                        <p className='text-xs text-slate-500'>Manzil</p>
                        <p className='mt-1.5 font-semibold text-slate-900'>
                          {order.shipping_address || 'Manzil kiritilmagan'}
                        </p>
                        <p className='mt-0.5 text-sm text-slate-600'>
                          {[order.shipping_city, order.shipping_state]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <p className='mt-0.5 text-sm text-slate-600'>
                          {[order.shipping_postal_code, order.shipping_country]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right: summary + payment */}
                <aside className='space-y-5'>
                  {/* Order summary */}
                  <section className='rounded-[2rem] bg-gradient-to-br from-amber-700 to-orange-800 p-6 text-white shadow-xl shadow-amber-900/20'>
                    <p className='text-sm font-semibold uppercase tracking-[0.24em] text-amber-200'>
                      Buyurtma xulosasi
                    </p>
                    <div className='mt-5 space-y-3 rounded-[1.5rem] border border-white/15 bg-white/10 p-5'>
                      <div className='flex items-center justify-between text-sm text-amber-100'>
                        <span>Oraliq summa</span>
                        <span>{formatMoney(order.subtotal)}</span>
                      </div>
                      <div className='flex items-center justify-between text-sm text-amber-100'>
                        <span>Yetkazib berish</span>
                        <span>
                          {Number.parseFloat(order.shipping_cost) > 0
                            ? formatMoney(order.shipping_cost)
                            : '0 UZS'}
                        </span>
                      </div>
                      {Number.parseFloat(order.discount_amount) > 0 && (
                        <div className='flex items-center justify-between text-sm text-amber-100'>
                          <span>Chegirma</span>
                          <span>−{formatMoney(order.discount_amount)}</span>
                        </div>
                      )}
                      <div className='border-t border-white/15 pt-3'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-amber-200'>Jami</span>
                          <span className='text-2xl font-semibold'>
                            {formatMoney(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment retry */}
                    {canRetryPayment && (
                      <div className='mt-5 rounded-[1.5rem] border border-white/15 bg-white/10 p-5'>
                        <div className='flex items-center gap-2.5'>
                          <CreditCard className='h-4 w-4 text-amber-200' />
                          <p className='text-sm font-semibold text-white'>
                            To&apos;lovni boshlash
                          </p>
                        </div>
                        <div className='mt-4 grid gap-2'>
                          {PAYMENT_PROVIDERS.map(p => (
                            <button
                              key={p.value}
                              type='button'
                              onClick={() => void handlePaymentInit(p.value)}
                              disabled={paymentBusy}
                              className='rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-60'
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {paymentResult?.provider_payload.redirect_url && (
                          <a
                            href={String(paymentResult.provider_payload.redirect_url)}
                            target='_blank'
                            rel='noreferrer'
                            className='mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 w-full justify-center'
                          >
                            <ExternalLink className='h-3.5 w-3.5' />
                            Provider sahifasini ochish
                          </a>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Actions */}
                  <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
                    <div className='flex items-center gap-2.5'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                        <Truck className='h-4 w-4' />
                      </div>
                      <h2 className='text-base font-semibold text-slate-900'>
                        Harakatlar
                      </h2>
                    </div>
                    <div className='mt-4 flex flex-col gap-2.5'>
                      {order.status !== 'DONE' && order.status !== 'CANCELLED' && (
                        <button
                          type='button'
                          onClick={() => void handleCancel()}
                          disabled={cancelBusy}
                          className='inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60'
                        >
                          <XCircle className='h-4 w-4' />
                          {cancelBusy ? 'Bekor qilinmoqda...' : 'Buyurtmani bekor qilish'}
                        </button>
                      )}
                      <Link
                        to='/orders'
                        className='rounded-2xl border border-stone-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-stone-50'
                      >
                        Barcha buyurtmalar
                        <ArrowRight className='ml-1.5 inline h-3.5 w-3.5' />
                      </Link>
                    </div>
                  </section>
                </aside>
              </div>
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
