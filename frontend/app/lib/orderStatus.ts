// Backend order status → Uzbek label + badge classes, ported from the old
// frontend's `getOrderStatusMeta` in `lib/commerce.ts`.
const STATUS_META: Record<string, { label: string; className: string }> = {
  NEW: { label: 'Yangi', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  PAYMENT_PENDING: { label: 'To\'lov kutilmoqda', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  PAID: { label: 'To\'langan', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  READY_FOR_PRODUCTION: { label: 'Ishlab chiqarishga tayyor', className: 'bg-sky-100 text-sky-800 border-sky-200' },
  IN_PRODUCTION: { label: 'Ishlab chiqarilmoqda', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  QUALITY_CHECK: { label: 'Sifat nazorati', className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
  READY_FOR_PICKUP: { label: 'Olib ketishga tayyor', className: 'bg-teal-100 text-teal-800 border-teal-200' },
  READY_FOR_DELIVERY: { label: 'Yetkazishga tayyor', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  COMPLETED: { label: 'Yakunlangan', className: 'bg-violet-100 text-violet-800 border-violet-200' },
  CANCELLED: { label: 'Bekor qilingan', className: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export function getOrderStatusMeta(status: string): { label: string; className: string } {
  return STATUS_META[status] ?? { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
}
