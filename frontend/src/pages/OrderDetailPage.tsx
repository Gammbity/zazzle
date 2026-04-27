import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
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

export default function OrderDetailPage({ orderLookup }: OrderDetailPageProps) {
  const queryClient = useQueryClient();
  const [authOpen, setAuthOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentInitResult | null>(
    null
  );
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
          "To'lovni qayta init qilib bo'lmadi."
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
      <main className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_20%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_44%,_#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='flex flex-wrap items-center gap-3'>
            <Link
              to='/orders'
              className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
            >
              <ArrowLeft className='h-4 w-4' />
              Buyurtmalar ro&apos;yxati
            </Link>
          </div>

          {loading ? (
            <div className='mt-8 h-72 animate-pulse rounded-[2rem] bg-slate-100' />
          ) : !isAuthenticated() ? (
            <div className='mt-8 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60'>
              <h1 className='text-3xl font-semibold text-slate-900'>
                Buyurtma tafsilotlari uchun kirish talab qilinadi
              </h1>
              <button
                type='button'
                onClick={() => setAuthOpen(true)}
                className='mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
              >
                Hisobga kirish
              </button>
            </div>
          ) : !order ? (
            <div className='mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-200/50'>
              <h1 className='text-3xl font-semibold text-slate-900'>
                Buyurtma topilmadi
              </h1>
              <p className='mt-3 text-base leading-7 text-slate-600'>
                Order raqamini tekshiring yoki buyurtmalar ro&apos;yxatiga
                qayting.
              </p>
            </div>
          ) : (
            <>
              <div className='mt-8 rounded-[2.2rem] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/60 backdrop-blur sm:p-8'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <p className='text-sm font-semibold uppercase tracking-[0.3em] text-sky-700'>
                      Buyurtma tafsiloti
                    </p>
                    <h1 className='mt-3 text-4xl font-semibold text-slate-950'>
                      {order.order_number}
                    </h1>
                    <p className='mt-3 max-w-3xl text-base leading-7 text-slate-600'>
                      {new Date(order.created_at).toLocaleString('uz-UZ')} da
                      yaratilgan buyurtma. Bu sahifada mahsulotlar, yetkazib
                      berish va to&apos;lov holati jamlangan.
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
                <div className='space-y-6'>
                  <section className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60'>
                    <h2 className='text-2xl font-semibold text-slate-900'>
                      Buyurtmadagi elementlar
                    </h2>
                    <div className='mt-5 space-y-4'>
                      {order.items.map(item => (
                        <article
                          key={item.id}
                          className='rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4'
                        >
                          <div className='flex flex-wrap items-start justify-between gap-3'>
                            <div>
                              <h3 className='text-lg font-semibold text-slate-900'>
                                {item.product_name}
                              </h3>
                              <p className='mt-1 text-sm text-slate-500'>
                                {item.design_title ||
                                  'Dizayn nomi kiritilmagan'}
                              </p>
                              <p className='mt-3 text-sm text-slate-600'>
                                Variant:{' '}
                                {[item.size, item.color]
                                  .filter(Boolean)
                                  .join(' · ') || 'Standart'}
                              </p>
                              <p className='mt-1 text-sm text-slate-600'>
                                Ishlab chiqarish holati:{' '}
                                {item.production_status}
                              </p>
                            </div>

                            <div className='rounded-2xl bg-white px-4 py-3 text-right'>
                              <p className='text-xs uppercase tracking-[0.16em] text-slate-400'>
                                Jami
                              </p>
                              <p className='mt-2 text-lg font-semibold text-slate-900'>
                                {formatMoney(item.total_price)}
                              </p>
                            </div>
                          </div>

                          <div className='mt-4 flex flex-wrap gap-3 text-sm text-slate-500'>
                            <span>Soni: {item.quantity}</span>
                            <span>
                              Bir dona: {formatMoney(item.unit_price)}
                            </span>
                            <span>SKU: {item.product_sku || 'n/a'}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60'>
                    <div className='flex items-center gap-3'>
                      <MapPin className='h-5 w-5 text-sky-700' />
                      <h2 className='text-2xl font-semibold text-slate-900'>
                        Yetkazib berish ma&apos;lumotlari
                      </h2>
                    </div>
                    <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                      <div className='rounded-[1.5rem] bg-slate-50 p-4'>
                        <p className='text-sm text-slate-500'>Qabul qiluvchi</p>
                        <p className='mt-2 text-lg font-semibold text-slate-900'>
                          {order.shipping_name}
                        </p>
                        <p className='mt-1 text-sm text-slate-600'>
                          {order.shipping_email}
                        </p>
                        <p className='mt-1 text-sm text-slate-600'>
                          {order.shipping_phone || 'Telefon kiritilmagan'}
                        </p>
                      </div>
                      <div className='rounded-[1.5rem] bg-slate-50 p-4'>
                        <p className='text-sm text-slate-500'>Manzil</p>
                        <p className='mt-2 text-lg font-semibold text-slate-900'>
                          {order.shipping_address || 'Aniq manzil kiritilmagan'}
                        </p>
                        <p className='mt-1 text-sm text-slate-600'>
                          {[order.shipping_city, order.shipping_state]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <p className='mt-1 text-sm text-slate-600'>
                          {[order.shipping_postal_code, order.shipping_country]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                <aside className='space-y-6'>
                  <section className='rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10'>
                    <p className='text-sm font-semibold uppercase tracking-[0.24em] text-sky-300'>
                      Buyurtma xulosasi
                    </p>
                    <div className='mt-6 space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5'>
                      <div className='flex items-center justify-between text-sm text-slate-200'>
                        <span>Oraliq summa</span>
                        <span>{formatMoney(order.subtotal)}</span>
                      </div>
                      <div className='flex items-center justify-between text-sm text-slate-200'>
                        <span>Yetkazib berish</span>
                        <span>
                          {Number.parseFloat(order.shipping_cost) > 0
                            ? formatMoney(order.shipping_cost)
                            : '0 UZS'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm text-slate-200'>
                        <span>Chegirma</span>
                        <span>
                          {Number.parseFloat(order.discount_amount) > 0
                            ? formatMoney(order.discount_amount)
                            : '0 UZS'}
                        </span>
                      </div>
                      <div className='border-t border-white/10 pt-4'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-slate-300'>Jami</span>
                          <span className='text-2xl font-semibold'>
                            {formatMoney(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canRetryPayment && (
                      <div className='mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5'>
                        <div className='flex items-center gap-3'>
                          <CreditCard className='h-5 w-5 text-sky-300' />
                          <p className='text-sm font-semibold text-white'>
                            To&apos;lovni qayta boshlash
                          </p>
                        </div>
                        <div className='mt-4 grid gap-3'>
                          <button
                            type='button'
                            onClick={() => void handlePaymentInit('payme')}
                            disabled={paymentBusy}
                            className='rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60'
                          >
                            Payme orqali boshlash
                          </button>
                          <button
                            type='button'
                            onClick={() => void handlePaymentInit('click')}
                            disabled={paymentBusy}
                            className='rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60'
                          >
                            Click orqali boshlash
                          </button>
                          <button
                            type='button'
                            onClick={() =>
                              void handlePaymentInit('uzcard_humo')
                            }
                            disabled={paymentBusy}
                            className='rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60'
                          >
                            Uzcard / Humo orqali boshlash
                          </button>
                        </div>

                        {paymentResult?.provider_payload.redirect_url && (
                          <a
                            href={String(
                              paymentResult.provider_payload.redirect_url
                            )}
                            target='_blank'
                            rel='noreferrer'
                            className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200'
                          >
                            Provider sahifasini ochish
                            <ArrowRight className='h-4 w-4' />
                          </a>
                        )}
                      </div>
                    )}
                  </section>

                  <section className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60'>
                    <div className='flex items-center gap-3'>
                      <Truck className='h-5 w-5 text-sky-700' />
                      <h2 className='text-xl font-semibold text-slate-900'>
                        Qo&apos;shimcha harakatlar
                      </h2>
                    </div>
                    <div className='mt-5 flex flex-col gap-3'>
                      {order.status !== 'DONE' &&
                        order.status !== 'CANCELLED' && (
                          <button
                            type='button'
                            onClick={() => void handleCancel()}
                            disabled={cancelBusy}
                            className='inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60'
                          >
                            <XCircle className='h-4 w-4' />
                            {cancelBusy
                              ? 'Bekor qilinmoqda...'
                              : 'Buyurtmani bekor qilish'}
                          </button>
                        )}
                      <Link
                        to='/orders'
                        className='rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
                      >
                        Barcha buyurtmalar
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
