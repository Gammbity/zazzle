import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageContainer from '@/components/PageContainer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <PageContainer className='flex flex-col items-center py-16 text-center'>
        <p className='text-sm font-semibold uppercase tracking-[0.25em] text-amber-700'>
          404
        </p>
        <h1 className='mt-4 text-4xl font-bold text-slate-900'>
          Sahifa topilmadi
        </h1>
        <p className='mt-3 text-slate-600'>
          Qidirgan sahifangiz mavjud emas yoki ko‘chirilgan.
        </p>
        <Link
          href='/'
          className='mt-7 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white'
        >
          Bosh sahifaga qaytish
        </Link>
      </PageContainer>
      <Footer />
    </>
  );
}
