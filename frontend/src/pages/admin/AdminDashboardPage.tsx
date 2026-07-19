import { useState } from 'react';
import {
  Boxes,
  ClipboardList,
  CreditCard,
  Package,
  PackageSearch,
  Wallet,
} from 'lucide-react';
import { useOrderAnalytics, useOrderStats } from '@/hooks/queries';
import { formatMoney } from '@/lib/commerce';
import { Link } from '@/lib/router';
import RevenueTrendChart from '@/components/admin/charts/RevenueTrendChart';
import HorizontalBarChart from '@/components/admin/charts/HorizontalBarChart';
import { useAdminPath } from '@/components/admin/AdminBaseContext';

const DAY_RANGE_OPTIONS = [7, 14, 30] as const;

export default function AdminDashboardPage() {
  const statsQuery = useOrderStats();
  const stats = statsQuery.data ?? null;

  const [days, setDays] = useState<(typeof DAY_RANGE_OPTIONS)[number]>(14);
  const analyticsQuery = useOrderAnalytics(days);
  const analytics = analyticsQuery.data ?? null;
  const adminPath = useAdminPath();

  return (
    <div>
      <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
        Admin
      </p>
      <h1 className='mt-2 text-3xl font-semibold text-slate-950'>Dashboard</h1>
      <p className='mt-2 max-w-2xl text-base leading-7 text-slate-500'>
        Buyurtmalar va do&apos;kon holati bo&apos;yicha umumiy ko&apos;rinish.
      </p>

      {statsQuery.isLoading ? (
        <div className='mt-8 h-40 animate-pulse rounded-[2rem] bg-amber-50' />
      ) : stats ? (
        <div className='mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4'>
          <div className='rounded-[1.6rem] bg-gradient-to-br from-amber-700 to-orange-800 p-5 text-white shadow-lg shadow-amber-900/20'>
            <div className='flex items-center gap-2.5'>
              <Boxes className='h-4 w-4 text-amber-200' />
              <span className='text-xs text-amber-200'>Jami buyurtma</span>
            </div>
            <p className='mt-3 text-3xl font-semibold'>{stats.total_orders}</p>
          </div>
          <div className='rounded-[1.6rem] border border-stone-200 bg-white p-5 shadow-sm shadow-stone-100/50'>
            <div className='flex items-center gap-2.5'>
              <CreditCard className='h-4 w-4 text-amber-600' />
              <span className='text-xs text-slate-500'>
                To&apos;lov kutilmoqda
              </span>
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
              <span className='text-xs text-slate-500'>Umumiy tushum</span>
            </div>
            <p className='mt-3 text-xl font-semibold text-slate-950'>
              {formatMoney(stats.total_revenue || 0)}
            </p>
          </div>
        </div>
      ) : null}

      <div className='mt-10 flex items-center justify-between'>
        <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
          Analitika
        </p>
        <div className='inline-flex rounded-full border border-stone-200 bg-white p-1'>
          {DAY_RANGE_OPTIONS.map(option => (
            <button
              key={option}
              type='button'
              onClick={() => setDays(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === option
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {option} kun
            </button>
          ))}
        </div>
      </div>

      <div className='mt-4 rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
        <p className='text-sm font-semibold text-slate-900'>
          Kunlik tushum
        </p>
        <p className='mt-0.5 text-xs text-slate-500'>
          Oxirgi {days} kunlik tushum va buyurtmalar soni dinamikasi.
        </p>
        <div className='mt-4'>
          {analyticsQuery.isLoading ? (
            <div className='h-56 animate-pulse rounded-2xl bg-amber-50' />
          ) : (
            <RevenueTrendChart
              data={
                analytics?.revenue_by_day.map(point => ({
                  date: point.date,
                  revenue: Number(point.revenue),
                  orders: point.orders,
                })) ?? []
              }
            />
          )}
        </div>
      </div>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <div className='rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
          <p className='text-sm font-semibold text-slate-900'>
            Buyurtmalar holati bo&apos;yicha
          </p>
          <p className='mt-0.5 text-xs text-slate-500'>
            Har bir bosqichda nechta buyurtma turgani.
          </p>
          <div className='mt-4'>
            {analyticsQuery.isLoading ? (
              <div className='h-56 animate-pulse rounded-2xl bg-amber-50' />
            ) : (
              <HorizontalBarChart
                data={
                  analytics?.orders_by_status
                    .filter(row => row.count > 0)
                    .map(row => ({ label: row.label, value: row.count })) ??
                  []
                }
              />
            )}
          </div>
        </div>

        <div className='rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
          <p className='text-sm font-semibold text-slate-900'>
            Top mahsulotlar
          </p>
          <p className='mt-0.5 text-xs text-slate-500'>
            Eng ko&apos;p sotilgan mahsulotlar (dona bo&apos;yicha).
          </p>
          <div className='mt-4'>
            {analyticsQuery.isLoading ? (
              <div className='h-56 animate-pulse rounded-2xl bg-amber-50' />
            ) : (
              <HorizontalBarChart
                data={
                  analytics?.top_products.map(product => ({
                    label: product.product_name,
                    value: product.units_sold,
                    valueLabel: `${product.units_sold} dona`,
                  })) ?? []
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <div className='rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
          <p className='text-sm font-semibold text-slate-900'>
            Yetkazib berish usuli
          </p>
          <p className='mt-0.5 text-xs text-slate-500'>
            Pochta orqali yetkazib berish va o&apos;zi olib ketish nisbati.
          </p>
          <div className='mt-4'>
            {analyticsQuery.isLoading ? (
              <div className='h-24 animate-pulse rounded-2xl bg-amber-50' />
            ) : (
              <HorizontalBarChart
                data={
                  analytics?.orders_by_delivery_method.map(row => ({
                    label: row.label,
                    value: row.count,
                  })) ?? []
                }
              />
            )}
          </div>
        </div>

        <div className='rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50'>
          <p className='text-sm font-semibold text-slate-900'>
            Ishlab chiqarish markazlari bo&apos;yicha
          </p>
          <p className='mt-0.5 text-xs text-slate-500'>
            Har bir markazga tushgan buyurtmalar soni.
          </p>
          <div className='mt-4'>
            {analyticsQuery.isLoading ? (
              <div className='h-24 animate-pulse rounded-2xl bg-amber-50' />
            ) : (
              <HorizontalBarChart
                data={
                  analytics?.orders_by_center.map(row => ({
                    label: row.center,
                    value: row.count,
                  })) ?? []
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className='mt-8 grid gap-4 sm:grid-cols-2'>
        <Link
          to={adminPath('/orders')}
          className='flex items-center gap-4 rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50 transition hover:border-amber-200 hover:shadow-amber-100/40'
        >
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700'>
            <ClipboardList className='h-5 w-5' />
          </div>
          <div>
            <p className='text-sm font-semibold text-slate-900'>
              Buyurtmalarni boshqarish
            </p>
            <p className='mt-0.5 text-xs text-slate-500'>
              Holat, dastavka usuli, tayinlash
            </p>
          </div>
        </Link>
        <Link
          to={adminPath('/products')}
          className='flex items-center gap-4 rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm shadow-stone-100/50 transition hover:border-amber-200 hover:shadow-amber-100/40'
        >
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700'>
            <Package className='h-5 w-5' />
          </div>
          <div>
            <p className='text-sm font-semibold text-slate-900'>
              Mahsulotlarni boshqarish
            </p>
            <p className='mt-0.5 text-xs text-slate-500'>
              Narx, variantlar, faollik
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
