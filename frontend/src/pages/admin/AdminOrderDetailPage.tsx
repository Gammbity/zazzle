import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Save, Store, Truck, UserCog } from 'lucide-react';
import {
  useAdminOrder,
  useAssignOrder,
  useOperators,
  useUpdateAdminOrder,
  useUpdateOrderProductionStatus,
} from '@/hooks/queries';
import {
  formatMoney,
  getCommerceErrorMessage,
  getOrderStatusMeta,
} from '@/lib/commerce';
import { Link } from '@/lib/router';

interface AdminOrderDetailPageProps {
  orderId: string;
}

const NEXT_PRODUCTION_STATUS: Record<
  string,
  { status: string; label: string } | undefined
> = {
  PAID: {
    status: 'READY_FOR_PRODUCTION',
    label: 'Ishlab chiqarishga tayyor deb belgilash',
  },
  READY_FOR_PRODUCTION: {
    status: 'IN_PRODUCTION',
    label: 'Ishlab chiqarishni boshlash',
  },
  IN_PRODUCTION: { status: 'DONE', label: 'Tayyor deb belgilash' },
};

const inputClass =
  'w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

export default function AdminOrderDetailPage({
  orderId,
}: AdminOrderDetailPageProps) {
  const orderQuery = useAdminOrder(orderId);
  const order = orderQuery.data ?? null;

  const updateOrderMutation = useUpdateAdminOrder();
  const productionMutation = useUpdateOrderProductionStatus();
  const operatorsQuery = useOperators();
  const assignMutation = useAssignOrder();

  const [notesForm, setNotesForm] = useState({
    admin_notes: '',
    tracking_number: '',
    carrier: '',
  });
  const [notesSaved, setNotesSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<number | ''>('');

  useEffect(() => {
    if (!order) return;
    setNotesForm({
      admin_notes: order.admin_notes ?? '',
      tracking_number: order.tracking_number ?? '',
      carrier: order.carrier ?? '',
    });
  }, [order]);

  if (orderQuery.isLoading) {
    return <div className='h-96 animate-pulse rounded-[2rem] bg-amber-50' />;
  }

  if (!order) {
    return (
      <div className='rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
        <h1 className='text-2xl font-semibold text-slate-900'>
          Buyurtma topilmadi
        </h1>
      </div>
    );
  }

  const statusMeta = getOrderStatusMeta(order.status);
  const nextStep = NEXT_PRODUCTION_STATUS[order.status];
  const isPickup = order.delivery_method === 'PICKUP';
  const lat = order.latitude != null ? Number(order.latitude) : null;
  const lng = order.longitude != null ? Number(order.longitude) : null;

  const handleSaveNotes = async () => {
    setError(null);
    try {
      await updateOrderMutation.mutateAsync({
        id: order.id,
        payload: notesForm,
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      setError(getCommerceErrorMessage(err, "Saqlab bo'lmadi."));
    }
  };

  const handleAdvanceProduction = async () => {
    if (!nextStep) return;
    setError(null);
    try {
      await productionMutation.mutateAsync({
        orderId: order.id,
        status: nextStep.status,
      });
    } catch (err) {
      setError(getCommerceErrorMessage(err, "Holatni o'zgartirib bo'lmadi."));
    }
  };

  const handleAssign = async () => {
    if (!selectedOperator) return;
    setError(null);
    try {
      await assignMutation.mutateAsync({
        orderId: order.id,
        operatorId: selectedOperator,
      });
    } catch (err) {
      setError(getCommerceErrorMessage(err, "Operator tayinlab bo'lmadi."));
    }
  };

  return (
    <div>
      <Link
        to='/admin/orders'
        className='inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-50'
      >
        <ArrowLeft className='h-4 w-4' />
        Buyurtmalar
      </Link>

      <div className='mt-6 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
            Buyurtma
          </p>
          <h1 className='mt-2 text-3xl font-semibold text-slate-950'>
            {order.order_number}
          </h1>
          <p className='mt-2 text-sm text-slate-500'>
            {new Date(order.created_at).toLocaleString('uz-UZ')}
          </p>
        </div>
        <span
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </div>

      {error && (
        <div className='mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
          {error}
        </div>
      )}

      <div className='mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <div className='space-y-6'>
          {/* Contact */}
          <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
            <h2 className='text-lg font-semibold text-slate-900'>Mijoz</h2>
            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              <div className='rounded-[1.5rem] bg-stone-50 p-4'>
                <p className='text-xs text-slate-500'>Ism</p>
                <p className='mt-1.5 font-semibold text-slate-900'>
                  {order.customer.full_name}
                </p>
                <p className='mt-0.5 text-sm text-slate-600'>
                  {order.customer.email}
                </p>
                <p className='mt-0.5 text-sm text-slate-600'>
                  {order.customer.phone_number ||
                    order.shipping_phone ||
                    'Telefon kiritilmagan'}
                </p>
              </div>
              <div className='rounded-[1.5rem] bg-stone-50 p-4'>
                <p className='text-xs text-slate-500'>Buyurtma izohi</p>
                <p className='mt-1.5 text-sm text-slate-700'>
                  {order.customer_notes || "Izoh yo'q"}
                </p>
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
            <div className='flex items-center gap-2.5'>
              <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                {isPickup ? (
                  <Store className='h-4 w-4' />
                ) : (
                  <MapPin className='h-4 w-4' />
                )}
              </div>
              <h2 className='text-lg font-semibold text-slate-900'>
                {isPickup ? 'Kelib olib ketish' : 'Yetkazib berish'}
              </h2>
            </div>

            {isPickup ? (
              <p className='mt-4 text-sm text-slate-600'>
                Mijoz do&apos;kondan o&apos;zi olib ketadi, yetkazib berish
                talab qilinmaydi.
              </p>
            ) : (
              <div className='mt-4 space-y-3'>
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
                </div>
                {lat != null && lng != null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline'
                  >
                    <MapPin className='h-3.5 w-3.5' />
                    Xaritada ko&apos;rish ({lat.toFixed(5)}, {lng.toFixed(5)})
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Items */}
          <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Mahsulotlar
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
                      <div className='mt-2 flex flex-wrap gap-3 text-xs text-slate-500'>
                        <span>
                          Variant:{' '}
                          {[item.size, item.color]
                            .filter(Boolean)
                            .join(' · ') || 'Standart'}
                        </span>
                        <span>Soni: {item.quantity}</span>
                      </div>
                    </div>
                    <p className='text-lg font-semibold text-slate-900'>
                      {formatMoney(item.total_price)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Admin notes */}
          <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Admin izohlari
            </h2>
            <div className='mt-4 space-y-3'>
              <textarea
                className={`${inputClass} min-h-20 resize-none`}
                value={notesForm.admin_notes}
                onChange={event =>
                  setNotesForm(prev => ({
                    ...prev,
                    admin_notes: event.target.value,
                  }))
                }
                placeholder='Ichki izoh...'
              />
              <div className='grid gap-3 sm:grid-cols-2'>
                <input
                  className={inputClass}
                  value={notesForm.tracking_number}
                  onChange={event =>
                    setNotesForm(prev => ({
                      ...prev,
                      tracking_number: event.target.value,
                    }))
                  }
                  placeholder='Tracking raqami'
                />
                <input
                  className={inputClass}
                  value={notesForm.carrier}
                  onChange={event =>
                    setNotesForm(prev => ({
                      ...prev,
                      carrier: event.target.value,
                    }))
                  }
                  placeholder='Yetkazib beruvchi'
                />
              </div>
              <button
                type='button'
                onClick={() => void handleSaveNotes()}
                disabled={updateOrderMutation.isPending}
                className='inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60'
              >
                <Save className='h-4 w-4' />
                {notesSaved
                  ? 'Saqlandi'
                  : updateOrderMutation.isPending
                    ? 'Saqlanmoqda...'
                    : 'Saqlash'}
              </button>
            </div>
          </section>
        </div>

        <aside className='space-y-5'>
          {/* Summary */}
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
                <span>{formatMoney(order.shipping_cost)}</span>
              </div>
              <div className='border-t border-white/15 pt-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-amber-200'>Jami</span>
                  <span className='text-2xl font-semibold'>
                    {formatMoney(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Production pipeline */}
          <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
            <div className='flex items-center gap-2.5'>
              <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                <Truck className='h-4 w-4' />
              </div>
              <h2 className='text-base font-semibold text-slate-900'>
                Ishlab chiqarish
              </h2>
            </div>
            <div className='mt-4'>
              {nextStep ? (
                <button
                  type='button'
                  onClick={() => void handleAdvanceProduction()}
                  disabled={productionMutation.isPending}
                  className='w-full rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60'
                >
                  {productionMutation.isPending
                    ? 'Yangilanmoqda...'
                    : nextStep.label}
                </button>
              ) : (
                <p className='text-sm text-slate-500'>
                  Hozirgi holatda ishlab chiqarish harakati mavjud emas.
                </p>
              )}
            </div>
          </section>

          {/* Operator assignment */}
          {operatorsQuery.data && operatorsQuery.data.length > 0 && (
            <section className='rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
              <div className='flex items-center gap-2.5'>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                  <UserCog className='h-4 w-4' />
                </div>
                <h2 className='text-base font-semibold text-slate-900'>
                  Operatorga tayinlash
                </h2>
              </div>
              <div className='mt-4 flex gap-2'>
                <select
                  className={inputClass}
                  value={selectedOperator}
                  onChange={event =>
                    setSelectedOperator(
                      event.target.value ? Number(event.target.value) : ''
                    )
                  }
                >
                  <option value=''>Operatorni tanlang</option>
                  {operatorsQuery.data.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.full_name || op.email}
                    </option>
                  ))}
                </select>
                <button
                  type='button'
                  onClick={() => void handleAssign()}
                  disabled={!selectedOperator || assignMutation.isPending}
                  className='shrink-0 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60'
                >
                  Tayinlash
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
