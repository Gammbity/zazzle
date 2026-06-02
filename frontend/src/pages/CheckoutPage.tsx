import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, MapPin, ShoppingBag, UserRound } from 'lucide-react';
import CommerceAuthModal from '@/components/commerce/CommerceAuthModal';
import {
  useCart,
  useCheckout,
  useCurrentUser,
  useInitPayment,
} from '@/hooks/queries';
import {
  formatMoney,
  getCommerceErrorMessage,
  isAuthenticated,
  type CheckoutResult,
  type PaymentInitResult,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';
import { Link } from '@/lib/router';

type PaymentProvider = 'payme' | 'click' | 'uzcard_humo';

const PROVIDERS: Array<{
  value: PaymentProvider;
  title: string;
  description: string;
  badge: string;
}> = [
  {
    value: 'payme',
    title: 'Payme',
    description: "Payme sahifasiga yo'naltirilasiz.",
    badge: 'Ommabop',
  },
  {
    value: 'click',
    title: 'Click',
    description: "Click to'lov oynasiga o'tiladi.",
    badge: '',
  },
  {
    value: 'uzcard_humo',
    title: 'Uzcard / Humo',
    description: 'Mahalliy karta orqali to\'lov.',
    badge: '',
  },
];

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `checkout-${Date.now()}`;
}

export default function CheckoutPage() {
  const queryClient = useQueryClient();
  const cartQuery = useCart();
  const userQuery = useCurrentUser();
  const checkoutMutation = useCheckout();
  const paymentMutation = useInitPayment();

  const [authOpen, setAuthOpen] = useState(false);
  const [result, setResult] = useState<{
    checkout: CheckoutResult;
    payment: PaymentInitResult | null;
  } | null>(null);
  const [paymentInitError, setPaymentInitError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>('payme');
  const [form, setForm] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    shipping_name: '',
    shipping_email: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_city: 'Tashkent',
    shipping_state: 'Tashkent',
    shipping_postal_code: '100000',
    shipping_country: 'Uzbekistan',
    customer_notes: '',
  });

  const cart = result ? null : (cartQuery.data ?? null);
  const user = userQuery.data ?? null;
  const loading = cartQuery.isLoading || userQuery.isLoading;
  const submitting = checkoutMutation.isPending || paymentMutation.isPending;
  const error =
    submitError ??
    (cartQuery.isError
      ? getCommerceErrorMessage(
          cartQuery.error,
          "Checkout ma'lumotlarini yuklab bo'lmadi."
        )
      : null);

  useEffect(() => {
    if (!user) return;
    const fullName =
      user.full_name ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const phone = user.profile?.phone_number || '';

    setForm(prev => ({
      ...prev,
      contact_name: prev.contact_name || fullName,
      contact_email: prev.contact_email || user.email || '',
      contact_phone: prev.contact_phone || phone,
      shipping_name: prev.shipping_name || fullName,
      shipping_email: prev.shipping_email || user.email || '',
      shipping_phone: prev.shipping_phone || phone,
    }));
  }, [user]);

  const canSubmit = useMemo(
    () =>
      Boolean(
        cart &&
        !cart.is_empty &&
        form.contact_name &&
        form.contact_email &&
        form.contact_phone
      ),
    [cart, form.contact_email, form.contact_name, form.contact_phone]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitError(null);
    setPaymentInitError(null);

    try {
      const checkout = await checkoutMutation.mutateAsync(form);
      let payment: PaymentInitResult | null = null;

      try {
        payment = await paymentMutation.mutateAsync({
          orderId: checkout.order_id,
          provider,
          idempotencyKey: createIdempotencyKey(),
        });
      } catch (paymentError: unknown) {
        setPaymentInitError(
          getCommerceErrorMessage(
            paymentError,
            "Buyurtma yaratildi, lekin to'lov init bosqichida xatolik bo'ldi."
          )
        );
      }

      setResult({ checkout, payment });
      queryClient.removeQueries({ queryKey: queryKeys.cart });
    } catch (checkoutError: unknown) {
      setSubmitError(
        getCommerceErrorMessage(checkoutError, "Checkoutni yakunlab bo'lmadi.")
      );
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 placeholder:text-slate-400';

  const renderGuestState = () => (
    <div className='rounded-[2rem] border border-amber-100 bg-white p-8 text-center shadow-sm shadow-amber-100/40'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-700'>
        <ShoppingBag className='h-7 w-7' />
      </div>
      <h2 className='mt-5 text-2xl font-semibold text-slate-900'>
        Checkout uchun hisob kerak
      </h2>
      <p className='mt-3 text-base leading-7 text-slate-600'>
        Buyurtmani yakunlash va to'lov transaction ochish uchun hisobga kiring.
      </p>
      <button
        type='button'
        onClick={() => setAuthOpen(true)}
        className='mt-6 rounded-2xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700'
      >
        Hisobga kirish
      </button>
    </div>
  );

  const renderSuccessState = () => {
    if (!result) return null;

    return (
      <div className='rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700'>
            <CheckCircle2 className='h-6 w-6' />
          </div>
          <div>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700'>
              Buyurtma tayyor
            </p>
            <h1 className='text-2xl font-semibold text-slate-950'>
              Buyurtma qabul qilindi
            </h1>
          </div>
        </div>

        <p className='mt-4 text-base leading-7 text-slate-600'>
          Order raqami:{' '}
          <strong className='font-semibold text-slate-900'>
            {result.checkout.order_number}
          </strong>
        </p>

        <div className='mt-6 grid gap-4 sm:grid-cols-3'>
          <div className='rounded-[1.5rem] border border-emerald-100 bg-white p-4'>
            <p className='text-xs text-slate-500'>Jami summa</p>
            <p className='mt-1.5 text-xl font-semibold text-slate-900'>
              {formatMoney(result.checkout.total_amount)}
            </p>
          </div>
          <div className='rounded-[1.5rem] border border-emerald-100 bg-white p-4'>
            <p className='text-xs text-slate-500'>Holat</p>
            <p className='mt-1.5 text-xl font-semibold text-slate-900'>
              {result.checkout.status}
            </p>
          </div>
          <div className='rounded-[1.5rem] border border-emerald-100 bg-white p-4'>
            <p className='text-xs text-slate-500'>To&apos;lov</p>
            <p className='mt-1.5 text-xl font-semibold text-slate-900'>
              {result.payment?.transaction.provider || provider}
            </p>
          </div>
        </div>

        {paymentInitError && (
          <div className='mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5'>
            <p className='text-sm font-semibold text-amber-900'>
              To&apos;lov hozircha ishga tushmadi
            </p>
            <p className='mt-2 text-sm leading-6 text-amber-800'>
              {paymentInitError}
            </p>
            <Link
              to={`/orders/${result.checkout.order_number}`}
              className='mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700'
            >
              Buyurtmada to&apos;lovni boshlash
              <ArrowRight className='h-4 w-4' />
            </Link>
          </div>
        )}

        {result.payment?.provider_payload.redirect_url && (
          <div className='mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5'>
            <p className='text-sm font-semibold text-amber-900'>
              To&apos;lovni davom ettirish havolasi tayyor
            </p>
            <a
              href={String(result.payment.provider_payload.redirect_url)}
              target='_blank'
              rel='noreferrer'
              className='mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700'
            >
              Provider sahifasini ochish
              <ArrowRight className='h-4 w-4' />
            </a>
          </div>
        )}

        <div className='mt-6 flex flex-wrap gap-3'>
          <Link
            to={`/orders/${result.checkout.order_number}`}
            className='rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700'
          >
            Buyurtma tafsilotlari
          </Link>
          <Link
            to='/orders'
            className='rounded-2xl border border-stone-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-stone-50'
          >
            Barcha buyurtmalar
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      <main className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_28%),linear-gradient(180deg,_#fffbeb_0%,_#ffffff_48%,_#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {result ? (
            renderSuccessState()
          ) : (
            <>
              {/* Page header */}
              <div className='rounded-[2.2rem] border border-amber-100 bg-white/90 p-6 shadow-sm shadow-amber-100/40 backdrop-blur sm:p-8'>
                <div className='flex items-center gap-3'>
                  <Link
                    to='/cart'
                    className='inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-stone-50'
                  >
                    <ArrowLeft className='h-3.5 w-3.5' />
                    Savat
                  </Link>
                </div>
                <p className='mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
                  Checkout
                </p>
                <h1 className='mt-2 text-3xl font-semibold text-slate-950'>
                  Buyurtmani yakunlash
                </h1>
                <p className='mt-2 max-w-2xl text-base leading-7 text-slate-500'>
                  Kontakt va yetkazib berish ma&apos;lumotlarini kiriting.
                </p>
              </div>

              {loading ? (
                <div className='mt-8 h-64 animate-pulse rounded-[2rem] bg-amber-50' />
              ) : !isAuthenticated() ? (
                <div className='mt-8'>{renderGuestState()}</div>
              ) : cart?.is_empty || !cart ? (
                <div className='mt-8 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
                  <h2 className='text-2xl font-semibold text-slate-900'>
                    Checkout uchun savat bo&apos;sh
                  </h2>
                  <p className='mt-3 text-base leading-7 text-slate-600'>
                    Avval mahsulot sahifasidan dizaynni savatga yuboring.
                  </p>
                  <Link
                    to='/cart'
                    className='mt-6 inline-flex rounded-2xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700'
                  >
                    Savatchaga qaytish
                  </Link>
                </div>
              ) : (
                <div className='mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    className='space-y-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'
                  >
                    {error && (
                      <div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                        {error}
                      </div>
                    )}

                    {/* Contact */}
                    <section>
                      <div className='flex items-center gap-2.5'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                          <UserRound className='h-4 w-4' />
                        </div>
                        <h2 className='text-base font-semibold text-slate-900'>
                          Kontakt ma&apos;lumotlari
                        </h2>
                      </div>
                      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                        <label className='block sm:col-span-1'>
                          <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                            Ism va familiya <span className='text-amber-600'>*</span>
                          </span>
                          <input
                            className={inputClass}
                            value={form.contact_name}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                contact_name: event.target.value,
                                shipping_name: prev.shipping_name || event.target.value,
                              }))
                            }
                            required
                            placeholder='Abdullayev Abdulla'
                          />
                        </label>
                        <label className='block sm:col-span-1'>
                          <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                            Email <span className='text-amber-600'>*</span>
                          </span>
                          <input
                            className={inputClass}
                            type='email'
                            value={form.contact_email}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                contact_email: event.target.value,
                                shipping_email: prev.shipping_email || event.target.value,
                              }))
                            }
                            required
                            placeholder='example@mail.com'
                          />
                        </label>
                        <label className='block sm:col-span-2'>
                          <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                            Telefon <span className='text-amber-600'>*</span>
                          </span>
                          <input
                            className={inputClass}
                            value={form.contact_phone}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                contact_phone: event.target.value,
                                shipping_phone: prev.shipping_phone || event.target.value,
                              }))
                            }
                            required
                            placeholder='+998 90 123 45 67'
                          />
                        </label>
                      </div>
                    </section>

                    {/* Delivery */}
                    <section>
                      <div className='flex items-center gap-2.5'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                          <MapPin className='h-4 w-4' />
                        </div>
                        <h2 className='text-base font-semibold text-slate-900'>
                          Yetkazib berish
                        </h2>
                      </div>
                      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                        <label className='block sm:col-span-2'>
                          <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                            Manzil
                          </span>
                          <input
                            className={inputClass}
                            value={form.shipping_address}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                shipping_address: event.target.value,
                              }))
                            }
                            placeholder="Ko'cha, uy raqami, ofis"
                          />
                        </label>
                        <label className='block'>
                          <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                            Shahar
                          </span>
                          <input
                            className={inputClass}
                            value={form.shipping_city}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                shipping_city: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className='block'>
                          <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                            Viloyat
                          </span>
                          <input
                            className={inputClass}
                            value={form.shipping_state}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                shipping_state: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className='block sm:col-span-2'>
                          <span className='mb-1.5 block text-sm font-medium text-slate-700'>
                            Izoh (ixtiyoriy)
                          </span>
                          <textarea
                            className={`${inputClass} min-h-24 resize-none`}
                            value={form.customer_notes}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                customer_notes: event.target.value,
                              }))
                            }
                            placeholder="Masalan, qo'ng'iroq qilib yetib kelishdan oldin xabar bering"
                          />
                        </label>
                      </div>
                    </section>

                    {/* Payment provider */}
                    <section>
                      <div className='flex items-center gap-2.5'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                          <CreditCard className='h-4 w-4' />
                        </div>
                        <h2 className='text-base font-semibold text-slate-900'>
                          To&apos;lov usuli
                        </h2>
                      </div>
                      <div className='mt-4 grid gap-2.5'>
                        {PROVIDERS.map(item => (
                          <button
                            key={item.value}
                            type='button'
                            onClick={() => setProvider(item.value)}
                            className={`rounded-2xl border p-4 text-left transition ${
                              provider === item.value
                                ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                                : 'border-stone-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'
                            }`}
                          >
                            <div className='flex items-center justify-between gap-3'>
                              <div>
                                <div className='flex items-center gap-2'>
                                  <p className='text-sm font-semibold text-slate-900'>
                                    {item.title}
                                  </p>
                                  {item.badge && (
                                    <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700'>
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className='mt-0.5 text-xs text-slate-500'>
                                  {item.description}
                                </p>
                              </div>
                              <div
                                className={`h-4 w-4 rounded-full border-2 transition ${
                                  provider === item.value
                                    ? 'border-amber-600 bg-amber-600'
                                    : 'border-stone-300'
                                }`}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>

                    <button
                      type='submit'
                      disabled={!canSubmit || submitting}
                      className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-amber-600/25 transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none'
                    >
                      {submitting
                        ? 'Yaratilmoqda...'
                        : "Buyurtmani yaratish va to'lovni boshlash"}
                      <ArrowRight className='h-4 w-4' />
                    </button>
                  </form>

                  {/* Summary sidebar */}
                  <aside className='space-y-4'>
                    <div className='rounded-[2rem] bg-gradient-to-br from-amber-700 to-orange-800 p-6 text-white shadow-xl shadow-amber-900/20'>
                      <p className='text-sm font-semibold uppercase tracking-[0.24em] text-amber-200'>
                        Buyurtma tarkibi
                      </p>
                      <div className='mt-5 space-y-3'>
                        {cart.items.map(item => (
                          <div
                            key={item.uuid}
                            className='rounded-2xl border border-white/15 bg-white/10 p-4'
                          >
                            <div className='flex items-start justify-between gap-3'>
                              <div>
                                <p className='text-sm font-semibold text-white'>
                                  {item.draft_name || item.product_name}
                                </p>
                                <p className='mt-0.5 text-xs text-amber-200'>
                                  {item.product_type_name} · {item.variant_display}
                                </p>
                              </div>
                              <span className='text-xs text-amber-200'>
                                ×{item.quantity}
                              </span>
                            </div>
                            <p className='mt-2 text-sm font-semibold text-amber-100'>
                              {formatMoney(item.total_price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between text-sm text-slate-500'>
                          <span>Oraliq summa</span>
                          <span>{formatMoney(cart.subtotal)}</span>
                        </div>
                        <div className='flex items-center justify-between text-sm text-slate-500'>
                          <span>Yetkazib berish</span>
                          <span className='text-xs'>Formdan keyin aniqlanadi</span>
                        </div>
                        <div className='border-t border-stone-100 pt-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-semibold text-slate-700'>
                              Jami
                            </span>
                            <span className='text-2xl font-semibold text-slate-950'>
                              {formatMoney(cart.total_amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
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
          queryClient.invalidateQueries({ queryKey: queryKeys.cart });
          queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
        }}
      />
    </>
  );
}
