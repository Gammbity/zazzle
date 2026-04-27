import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CreditCard, MapPin, Phone, UserRound } from 'lucide-react';
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
}> = [
  {
    value: 'payme',
    title: 'Payme',
    description:
      "To'lovni Payme sahifasida davom ettirish uchun init qilinadi.",
  },
  {
    value: 'click',
    title: 'Click',
    description:
      "Click orqali to'lov oynasiga yo'naltirish uchun init qilinadi.",
  },
  {
    value: 'uzcard_humo',
    title: 'Uzcard / Humo',
    description:
      'Terminal parametrlarini olish uchun lokal transaction yaratiladi.',
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

  // Prefill checkout form once the user's profile lands.
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

  const renderGuestState = () => (
    <div className='rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60'>
      <h2 className='text-3xl font-semibold text-slate-900'>
        Checkout uchun hisob kerak
      </h2>
      <p className='mt-3 text-base leading-7 text-slate-600'>
        Savatdagi elementlarni orderga aylantirish va payment transaction ochish
        uchun hisobga kiring.
      </p>
      <button
        type='button'
        onClick={() => setAuthOpen(true)}
        className='mt-6 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
      >
        Hisobga kirish
      </button>
    </div>
  );

  const renderSuccessState = () => {
    if (!result) {
      return null;
    }

    return (
      <div className='rounded-[2rem] border border-emerald-200 bg-[linear-gradient(180deg,_#f0fdf4_0%,_#ffffff_100%)] p-8 shadow-sm shadow-emerald-100/60'>
        <p className='text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700'>
          Buyurtma tayyor
        </p>
        <h1 className='mt-4 text-4xl font-semibold text-slate-950'>
          Buyurtma qabul qilindi
        </h1>
        <p className='mt-3 max-w-3xl text-base leading-7 text-slate-600'>
          Order raqami <strong>{result.checkout.order_number}</strong>. Endi
          statuslar buyurtmalar bo&apos;limida ko&apos;rinadi.
        </p>

        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          <div className='rounded-[1.5rem] border border-emerald-200 bg-white p-4'>
            <p className='text-sm text-slate-500'>Jami summa</p>
            <p className='mt-2 text-2xl font-semibold text-slate-900'>
              {formatMoney(result.checkout.total_amount)}
            </p>
          </div>
          <div className='rounded-[1.5rem] border border-emerald-200 bg-white p-4'>
            <p className='text-sm text-slate-500'>Status</p>
            <p className='mt-2 text-2xl font-semibold text-slate-900'>
              {result.checkout.status}
            </p>
          </div>
          <div className='rounded-[1.5rem] border border-emerald-200 bg-white p-4'>
            <p className='text-sm text-slate-500'>To&apos;lov provideri</p>
            <p className='mt-2 text-2xl font-semibold text-slate-900'>
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
              {paymentInitError} Buyurtma saqlangan. Quyidagi tafsilot
              sahifasida to&apos;lovni qayta boshlashingiz mumkin.
            </p>
            <Link
              to={`/orders/${result.checkout.order_number}`}
              className='mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800'
            >
              Buyurtmaga o&apos;tib to&apos;lovni qayta boshlash
              <ArrowRight className='h-4 w-4' />
            </Link>
          </div>
        )}

        {result.payment?.provider_payload.redirect_url && (
          <div className='mt-6 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5'>
            <p className='text-sm font-semibold text-sky-900'>
              To&apos;lovni davom ettirish havolasi tayyor
            </p>
            <p className='mt-2 text-sm leading-6 text-sky-800'>
              Tashqi provayder integratsiyasi hozir placeholder rejimida, lekin
              transaction va order bog&apos;lanishi yaratildi.
            </p>
            <a
              href={String(result.payment.provider_payload.redirect_url)}
              target='_blank'
              rel='noreferrer'
              className='mt-4 inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800'
            >
              Provider sahifasini ochish
              <ArrowRight className='h-4 w-4' />
            </a>
          </div>
        )}

        <div className='mt-6 flex flex-wrap gap-3'>
          <Link
            to={`/orders/${result.checkout.order_number}`}
            className='rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
          >
            Buyurtma tafsilotlari
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      <main className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,_#fffef7_0%,_#ffffff_48%,_#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          {result ? (
            renderSuccessState()
          ) : (
            <>
              <div className='rounded-[2.2rem] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/60 backdrop-blur sm:p-8'>
                <p className='text-sm font-semibold uppercase tracking-[0.3em] text-sky-700'>
                  Checkout
                </p>
                <h1 className='mt-3 text-4xl font-semibold text-slate-950'>
                  Buyurtmani yakunlash
                </h1>
                <p className='mt-3 max-w-3xl text-base leading-7 text-slate-600'>
                  Kontakt, yetkazib berish va to&apos;lov providerini tanlang.
                  Buyurtma yaratilib bo&apos;lgach payment transaction init
                  qilinadi.
                </p>
              </div>

              {loading ? (
                <div className='mt-8 h-72 animate-pulse rounded-[2rem] bg-slate-100' />
              ) : !isAuthenticated() ? (
                <div className='mt-8'>{renderGuestState()}</div>
              ) : cart?.is_empty || !cart ? (
                <div className='mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-200/50'>
                  <h2 className='text-3xl font-semibold text-slate-900'>
                    Checkout uchun savat bo&apos;sh
                  </h2>
                  <p className='mt-3 text-base leading-7 text-slate-600'>
                    Avval mahsulot sahifasidan kamida bitta dizaynni savatga
                    yuboring.
                  </p>
                  <Link
                    to='/cart'
                    className='mt-6 inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
                  >
                    Savatchaga qaytish
                  </Link>
                </div>
              ) : (
                <div className='mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
                  <form
                    onSubmit={handleSubmit}
                    className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60'
                  >
                    {error && (
                      <div className='mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                        {error}
                      </div>
                    )}

                    <section>
                      <div className='flex items-center gap-3'>
                        <UserRound className='h-5 w-5 text-sky-700' />
                        <h2 className='text-xl font-semibold text-slate-900'>
                          Kontakt ma&apos;lumotlari
                        </h2>
                      </div>
                      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                        <label className='block sm:col-span-1'>
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Ism va familiya
                          </span>
                          <input
                            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                            value={form.contact_name}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                contact_name: event.target.value,
                                shipping_name:
                                  prev.shipping_name || event.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                        <label className='block sm:col-span-1'>
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Email
                          </span>
                          <input
                            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                            type='email'
                            value={form.contact_email}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                contact_email: event.target.value,
                                shipping_email:
                                  prev.shipping_email || event.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                        <label className='block sm:col-span-2'>
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Telefon
                          </span>
                          <input
                            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                            value={form.contact_phone}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                contact_phone: event.target.value,
                                shipping_phone:
                                  prev.shipping_phone || event.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                      </div>
                    </section>

                    <section className='mt-8'>
                      <div className='flex items-center gap-3'>
                        <MapPin className='h-5 w-5 text-sky-700' />
                        <h2 className='text-xl font-semibold text-slate-900'>
                          Yetkazib berish
                        </h2>
                      </div>
                      <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                        <label className='block sm:col-span-2'>
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Manzil
                          </span>
                          <input
                            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                            value={form.shipping_address}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                shipping_address: event.target.value,
                              }))
                            }
                            placeholder="Ko'cha, uy, ofis"
                          />
                        </label>
                        <label className='block'>
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Shahar
                          </span>
                          <input
                            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
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
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Viloyat
                          </span>
                          <input
                            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                            value={form.shipping_state}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                shipping_state: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className='block'>
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Pochta indeksi
                          </span>
                          <input
                            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                            value={form.shipping_postal_code}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                shipping_postal_code: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className='block'>
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Mamlakat
                          </span>
                          <input
                            className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                            value={form.shipping_country}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                shipping_country: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className='block sm:col-span-2'>
                          <span className='mb-1 block text-sm font-medium text-slate-700'>
                            Izoh
                          </span>
                          <textarea
                            className='min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
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

                    <section className='mt-8'>
                      <div className='flex items-center gap-3'>
                        <CreditCard className='h-5 w-5 text-sky-700' />
                        <h2 className='text-xl font-semibold text-slate-900'>
                          To&apos;lov provideri
                        </h2>
                      </div>
                      <div className='mt-4 grid gap-3'>
                        {PROVIDERS.map(item => (
                          <button
                            key={item.value}
                            type='button'
                            onClick={() => setProvider(item.value)}
                            className={`rounded-[1.35rem] border p-4 text-left transition ${
                              provider === item.value
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                            }`}
                          >
                            <div className='flex items-center justify-between gap-3'>
                              <div>
                                <p className='text-base font-semibold'>
                                  {item.title}
                                </p>
                                <p
                                  className={`mt-1 text-sm leading-6 ${
                                    provider === item.value
                                      ? 'text-slate-200'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {item.description}
                                </p>
                              </div>
                              <span
                                className={`h-4 w-4 rounded-full border ${
                                  provider === item.value
                                    ? 'border-white bg-white'
                                    : 'border-slate-300'
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
                      className='mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      {submitting
                        ? 'Yaratilmoqda...'
                        : "Buyurtmani yaratish va to'lovni boshlash"}
                      <ArrowRight className='h-4 w-4' />
                    </button>
                  </form>

                  <aside className='space-y-4'>
                    <div className='rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10'>
                      <p className='text-sm font-semibold uppercase tracking-[0.24em] text-sky-300'>
                        Buyurtma xulosasi
                      </p>
                      <div className='mt-6 space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5'>
                        {cart.items.map(item => (
                          <div
                            key={item.uuid}
                            className='rounded-2xl border border-white/10 bg-white/5 p-4'
                          >
                            <div className='flex items-start justify-between gap-3'>
                              <div>
                                <p className='text-sm font-semibold text-white'>
                                  {item.draft_name || item.product_name}
                                </p>
                                <p className='mt-1 text-xs text-slate-300'>
                                  {item.product_type_name} ·{' '}
                                  {item.variant_display}
                                </p>
                              </div>
                              <div className='text-right text-sm text-slate-200'>
                                x{item.quantity}
                              </div>
                            </div>
                            <p className='mt-3 text-sm font-medium text-slate-100'>
                              {formatMoney(item.total_price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60'>
                      <div className='flex items-center justify-between text-sm text-slate-500'>
                        <span>Oraliq summa</span>
                        <span>{formatMoney(cart.subtotal)}</span>
                      </div>
                      <div className='mt-3 flex items-center justify-between text-sm text-slate-500'>
                        <span>Yetkazib berish</span>
                        <span>Formdan keyin orderga yoziladi</span>
                      </div>
                      <div className='mt-4 border-t border-slate-100 pt-4'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-slate-700'>
                            Jami
                          </span>
                          <span className='text-2xl font-semibold text-slate-950'>
                            {formatMoney(cart.total_amount)}
                          </span>
                        </div>
                      </div>

                      {user?.profile?.phone_number && (
                        <div className='mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600'>
                          <Phone className='h-4 w-4 text-sky-700' />
                          Profil telefon raqami checkout formasiga kiritib
                          qo&apos;yildi.
                        </div>
                      )}

                      <div className='mt-5 flex flex-col gap-3'>
                        <Link
                          to='/cart'
                          className='rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
                        >
                          Savatchaga qaytish
                        </Link>
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
