import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Package2, ShoppingBag, Trash2 } from 'lucide-react';
import CommerceAuthModal from '@/components/commerce/CommerceAuthModal';
import {
  useCart,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/hooks/queries';
import {
  formatMoney,
  getCommerceErrorMessage,
  getRouteSlugForCategory,
  isAuthenticated,
} from '@/lib/commerce';
import { queryKeys } from '@/lib/queryClient';
import { Link } from '@/lib/router';

export default function CartPage() {
  const queryClient = useQueryClient();
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const cartQuery = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();

  const cart = cartQuery.data ?? null;
  const loading = cartQuery.isLoading;
  const error =
    actionError ??
    (cartQuery.isError
      ? getCommerceErrorMessage(
          cartQuery.error,
          'Savatchani yuklashda xatolik yuz berdi.'
        )
      : null);

  const handleQuantityChange = async (itemUuid: string, quantity: number) => {
    setBusyItem(itemUuid);
    setActionError(null);
    try {
      await updateMutation.mutateAsync({ itemUuid, quantity });
    } catch {
      setActionError("Savat elementini yangilab bo'lmadi.");
    } finally {
      setBusyItem(null);
    }
  };

  const handleRemove = async (itemUuid: string) => {
    setBusyItem(itemUuid);
    setActionError(null);
    try {
      await removeMutation.mutateAsync(itemUuid);
    } catch {
      setActionError("Elementni savatdan olib tashlab bo'lmadi.");
    } finally {
      setBusyItem(null);
    }
  };

  const handleClear = async () => {
    setBusyItem('clear');
    setActionError(null);
    try {
      await clearMutation.mutateAsync();
    } catch {
      setActionError("Savatchani tozalab bo'lmadi.");
    } finally {
      setBusyItem(null);
    }
  };

  const renderGuestState = () => (
    <div className='rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60'>
      <div className='mx-auto max-w-2xl text-center'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-700'>
          <ShoppingBag className='h-7 w-7' />
        </div>
        <h2 className='mt-5 text-3xl font-semibold text-slate-900'>
          Savat backend hisob bilan ishlaydi
        </h2>
        <p className='mt-3 text-base leading-7 text-slate-600'>
          Dizaynlaringizni saqlash, checkout qilish va order tarixini
          ko&apos;rish uchun hisobga kiring yoki yangi hisob oching.
        </p>
        <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
          <button
            type='button'
            onClick={() => setAuthOpen(true)}
            className='rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
          >
            Hisobga kirish
          </button>
          <Link
            to='/'
            className='rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50'
          >
            Mahsulotlarni ko&apos;rish
          </Link>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className='rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm shadow-slate-200/50'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-700'>
        <Package2 className='h-7 w-7' />
      </div>
      <h2 className='mt-5 text-3xl font-semibold text-slate-900'>
        Savatcha hozircha bo&apos;sh
      </h2>
      <p className='mt-3 text-base leading-7 text-slate-600'>
        Mahsulot sahifasida dizaynni tayyorlab, variantni tanlang va savatchaga
        yuboring.
      </p>
      <div className='mt-6 flex justify-center'>
        <Link
          to='/'
          className='inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700'
        >
          Mahsulotlarga qaytish
          <ArrowRight className='h-4 w-4' />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <main className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_26%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_36%,_#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='rounded-[2.2rem] border border-slate-200 bg-white/85 p-6 shadow-sm shadow-slate-200/60 backdrop-blur sm:p-8'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-[0.3em] text-sky-700'>
                  Savat
                </p>
                <h1 className='mt-3 text-4xl font-semibold text-slate-950'>
                  Savatchangiz
                </h1>
                <p className='mt-3 max-w-3xl text-base leading-7 text-slate-600'>
                  Tanlangan mahsulotlar shu yerda jamlanadi. Miqdorni tekshirib,
                  keyingi bosqichda checkoutni boshlaysiz.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className='mt-8 h-72 animate-pulse rounded-[2rem] bg-slate-100' />
          ) : !isAuthenticated() ? (
            <div className='mt-8'>{renderGuestState()}</div>
          ) : cart?.is_empty || !cart ? (
            <div className='mt-8'>{renderEmptyState()}</div>
          ) : (
            <div className='mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
              <div className='space-y-4'>
                {error && (
                  <div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                    {error}
                  </div>
                )}

                {cart.items.map(item => {
                  const productRoute = getRouteSlugForCategory(
                    item.product_category
                  );

                  return (
                    <article
                      key={item.uuid}
                      className='rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50'
                    >
                      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                        <div>
                          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-sky-700'>
                            {item.product_type_name}
                          </p>
                          <h2 className='mt-2 text-2xl font-semibold text-slate-900'>
                            {item.draft_name || item.product_name}
                          </h2>
                          <p className='mt-2 text-sm text-slate-500'>
                            Variant: {item.variant_display}
                          </p>
                          {productRoute && (
                            <Link
                              to={`/products/${productRoute}`}
                              className='mt-3 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800'
                            >
                              Mahsulot sahifasini ochish
                            </Link>
                          )}
                        </div>

                        <div className='rounded-2xl bg-slate-50 px-4 py-3 text-right'>
                          <p className='text-sm text-slate-500'>Jami</p>
                          <p className='mt-1 text-xl font-semibold text-slate-900'>
                            {formatMoney(item.total_price)}
                          </p>
                        </div>
                      </div>

                      <div className='mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4'>
                        <div className='flex items-center gap-3'>
                          <button
                            type='button'
                            onClick={() =>
                              void handleQuantityChange(
                                item.uuid,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            disabled={busyItem === item.uuid}
                            className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
                          >
                            -
                          </button>
                          <div className='min-w-16 rounded-full bg-slate-100 px-4 py-2 text-center text-sm font-semibold text-slate-900'>
                            {item.quantity}
                          </div>
                          <button
                            type='button'
                            onClick={() =>
                              void handleQuantityChange(
                                item.uuid,
                                item.quantity + 1
                              )
                            }
                            disabled={busyItem === item.uuid}
                            className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
                          >
                            +
                          </button>
                        </div>

                        <div className='flex flex-wrap items-center gap-3'>
                          <div className='text-sm text-slate-500'>
                            Bir dona: {formatMoney(item.unit_price)}
                          </div>
                          <button
                            type='button'
                            onClick={() => void handleRemove(item.uuid)}
                            disabled={busyItem === item.uuid}
                            className='inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50'
                          >
                            <Trash2 className='h-4 w-4' />
                            Olib tashlash
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className='rounded-[1.85rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10'>
                <p className='text-sm font-semibold uppercase tracking-[0.24em] text-sky-300'>
                  Xulosa
                </p>
                <div className='mt-6 space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5'>
                  <div className='flex items-center justify-between text-sm text-slate-200'>
                    <span>Mahsulotlar soni</span>
                    <span>{cart.total_items}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm text-slate-200'>
                    <span>Oraliq summa</span>
                    <span>{formatMoney(cart.subtotal)}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm text-slate-200'>
                    <span>Yetkazib berish</span>
                    <span>
                      {Number.parseFloat(cart.shipping_cost) > 0
                        ? formatMoney(cart.shipping_cost)
                        : 'Checkoutda aniqlanadi'}
                    </span>
                  </div>
                  <div className='border-t border-white/10 pt-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-slate-300'>Jami</span>
                      <span className='text-2xl font-semibold'>
                        {formatMoney(cart.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className='mt-5 text-sm leading-6 text-slate-300'>
                  Checkout bosqichida aloqa va yetkazib berish ma&apos;lumotlari
                  so&apos;raladi.
                </p>

                <div className='mt-6 flex flex-col gap-3'>
                  <Link
                    to='/checkout'
                    className='inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100'
                  >
                    Checkoutga o&apos;tish
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                  <button
                    type='button'
                    onClick={() => void handleClear()}
                    disabled={busyItem === 'clear'}
                    className='rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50'
                  >
                    Savatchani tozalash
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <CommerceAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.cart });
        }}
      />
    </>
  );
}
