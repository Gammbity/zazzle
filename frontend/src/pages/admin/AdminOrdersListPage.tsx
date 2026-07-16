import { useState } from 'react';
import { ArrowRight, Search, Store, Truck } from 'lucide-react';
import { useAdminOrders } from '@/hooks/queries';
import { formatMoney, getOrderStatusMeta } from '@/lib/commerce';
import { Link } from '@/lib/router';

const STATUS_OPTIONS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'NEW', label: 'Yangi' },
  { value: 'PAYMENT_PENDING', label: "To'lov kutilmoqda" },
  { value: 'PAID', label: "To'langan" },
  { value: 'READY_FOR_PRODUCTION', label: 'Ishlab chiqarishga tayyor' },
  { value: 'IN_PRODUCTION', label: 'Ishlab chiqarilmoqda' },
  { value: 'QUALITY_CHECK', label: 'Sifat nazorati' },
  { value: 'READY_FOR_PICKUP', label: 'Olib ketishga tayyor' },
  { value: 'READY_FOR_DELIVERY', label: 'Yetkazishga tayyor' },
  { value: 'COMPLETED', label: 'Yakunlangan' },
  { value: 'CANCELLED', label: 'Bekor qilingan' },
];

const DELIVERY_OPTIONS = [
  { value: '', label: 'Barcha usullar' },
  { value: 'DELIVERY', label: 'Yetkazib berish' },
  { value: 'PICKUP', label: 'Kelib olib ketish' },
];

const selectClass =
  'rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100';

export default function AdminOrdersListPage() {
  const [status, setStatus] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const ordersQuery = useAdminOrders({
    status: status || undefined,
    delivery_method: (deliveryMethod || undefined) as
      | 'DELIVERY'
      | 'PICKUP'
      | undefined,
    search: search || undefined,
    page,
  });

  const results = ordersQuery.data?.results ?? [];

  return (
    <div>
      <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
        Admin
      </p>
      <h1 className='mt-2 text-3xl font-semibold text-slate-950'>
        Buyurtmalar
      </h1>

      <div className='mt-6 flex flex-wrap items-center gap-3'>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <input
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder='Order raqami, email, ism...'
            className={`${selectClass} w-64 pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={event => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={deliveryMethod}
          onChange={event => {
            setDeliveryMethod(event.target.value);
            setPage(1);
          }}
          className={selectClass}
        >
          {DELIVERY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {ordersQuery.isLoading ? (
        <div className='mt-6 h-64 animate-pulse rounded-[2rem] bg-amber-50' />
      ) : results.length === 0 ? (
        <div className='mt-6 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50/30 p-10 text-center'>
          <p className='text-base text-slate-600'>
            Hech qanday buyurtma topilmadi.
          </p>
        </div>
      ) : (
        <div className='mt-6 grid gap-3'>
          {results.map(order => {
            const statusMeta = getOrderStatusMeta(order.status);
            const isPickup = order.delivery_method === 'PICKUP';
            return (
              <article
                key={order.id}
                className='rounded-[1.8rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50 transition hover:border-amber-200 hover:shadow-amber-100/40'
              >
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <div className='flex flex-wrap items-center gap-2.5'>
                      <h2 className='text-lg font-semibold text-slate-950'>
                        {order.order_number}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                      <span className='inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-slate-600'>
                        {isPickup ? (
                          <Store className='h-3 w-3' />
                        ) : (
                          <Truck className='h-3 w-3' />
                        )}
                        {isPickup ? 'Olib ketish' : 'Yetkazib berish'}
                      </span>
                    </div>
                    <p className='mt-1.5 text-sm text-slate-500'>
                      {order.customer_name} ·{' '}
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
                      to={`/admin/orders/${order.id}`}
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

      {ordersQuery.data &&
        (ordersQuery.data.next || ordersQuery.data.previous) && (
          <div className='mt-6 flex items-center justify-center gap-3'>
            <button
              type='button'
              disabled={!ordersQuery.data.previous}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className='rounded-2xl border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              Oldingi
            </button>
            <span className='text-sm text-slate-500'>{page}-sahifa</span>
            <button
              type='button'
              disabled={!ordersQuery.data.next}
              onClick={() => setPage(p => p + 1)}
              className='rounded-2xl border border-stone-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              Keyingi
            </button>
          </div>
        )}
    </div>
  );
}
