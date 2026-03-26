import { Link } from '@/lib/router';

export default function NotFoundPage() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] px-4 text-center'>
      <p className='text-sm font-semibold uppercase tracking-[0.35em] text-sky-700'>
        404
      </p>
      <h1 className='text-4xl font-bold text-slate-900'>Sahifa topilmadi</h1>
      <p className='max-w-md text-base leading-7 text-slate-600'>
        Kiritilgan manzil mavjud emas yoki yangi SPA oqimiga hali ko'chirilmagan
        bo'lishi mumkin.
      </p>
      <Link
        to='/'
        className='rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700'
      >
        Bosh sahifaga qaytish
      </Link>
    </main>
  );
}
