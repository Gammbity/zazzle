import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import AppImage from '@/components/AppImage';
import { cn } from '@/lib/utils';

const HERO_SISTERS_PHOTO =
  'https://images.pexels.com/photos/6945632/pexels-photo-6945632.jpeg?cs=srgb&dl=pexels-polina-tankilevitch-6945632.jpg&fm=jpg';

interface FloatingProductCardProps {
  className: string;
  motionClassName: string;
  tiltClassName: string;
  badge: string;
  note: string;
  src: string;
  imageClassName: string;
  surfaceClassName?: string;
  ornamentClassName?: string;
  frameClassName?: string;
  children: ReactNode;
}

function scrollToId(id: string) {
  const element = document.getElementById(id);

  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function FloatingProductCard({
  className,
  motionClassName,
  tiltClassName,
  badge,
  note,
  src,
  imageClassName,
  surfaceClassName,
  ornamentClassName,
  frameClassName,
  children,
}: FloatingProductCardProps) {
  return (
    <div
      aria-hidden='true'
      className={`pointer-events-none absolute ${className} ${motionClassName}`}
    >
      <div
        className={cn(
          'bg-white/72 relative rounded-[2.15rem] border border-white/75 p-3.5 shadow-[0_40px_95px_-44px_rgba(15,23,42,0.58)] backdrop-blur-xl',
          tiltClassName
        )}
      >
        <div className='pointer-events-none absolute inset-[10px] rounded-[1.85rem] border border-white/60 opacity-80' />

        <div className='relative flex items-center justify-between gap-2 px-1'>
          <span className='rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90'>
            {badge}
          </span>
          <span className='text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500'>
            {note}
          </span>
        </div>

        <div
          className={cn(
            'relative mt-3 aspect-square overflow-hidden rounded-[1.8rem] border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]',
            'bg-[linear-gradient(145deg,_rgba(255,255,255,0.97)_0%,_rgba(241,245,249,0.95)_54%,_rgba(254,243,199,0.90)_100%)]',
            surfaceClassName
          )}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-0 opacity-95',
              ornamentClassName
            )}
          />
          <div className='bg-white/84 pointer-events-none absolute inset-[8%] rounded-[1.45rem] border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_20px_32px_-28px_rgba(15,23,42,0.42)]' />
          <div className='pointer-events-none absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/75 bg-white/70 shadow-sm backdrop-blur-sm'>
            <div className='h-2.5 w-2.5 rounded-full bg-gradient-to-br from-sky-400 via-cyan-400 to-amber-400 shadow-[0_0_18px_rgba(56,189,248,0.5)]' />
          </div>
          <div className='pointer-events-none absolute left-4 top-4 h-14 w-14 rounded-full bg-white/55 blur-2xl' />
          <div className='bg-slate-900/12 pointer-events-none absolute inset-x-8 bottom-3 h-7 rounded-full blur-2xl' />
          <AppImage
            src={src}
            alt=''
            fill
            priority
            className={cn(
              'z-[1] transition-transform duration-700',
              imageClassName
            )}
          />
          {children}
          <div
            className={cn(
              'pointer-events-none absolute inset-[8%] rounded-[1.45rem] border border-slate-100/70',
              frameClassName
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section
      className='relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_32%),radial-gradient(circle_at_82%_18%,_rgba(14,165,233,0.20),_transparent_28%),radial-gradient(circle_at_88%_78%,_rgba(249,115,22,0.12),_transparent_22%),linear-gradient(135deg,_#fffdf7_0%,_#ffffff_46%,_#f3f9ff_100%)] px-4 pb-16 pt-6 text-slate-900 sm:px-6 lg:px-8 lg:pb-24'
      aria-label='Kirish'
    >
      <div
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,_rgba(255,255,255,0.72),_transparent_22%),radial-gradient(circle_at_72%_68%,_rgba(255,255,255,0.5),_transparent_18%)]'
        aria-hidden='true'
      />

      <div className='mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/80 bg-white/80 px-4 py-3 shadow-lg shadow-slate-200/40 backdrop-blur sm:px-6'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.35em] text-sky-700'>
            Zazzle Uzbekistan
          </p>
          <p className='mt-1 text-sm text-slate-500'>
            Futbolka, krujka va sovg'a mahsulotlari uchun bosma platforma
          </p>
        </div>

        <button
          type='button'
          onClick={() => scrollToId('products')}
          className='inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700'
        >
          Boshlash
          <ArrowRight className='h-4 w-4' />
        </button>
      </div>

      <div className='mx-auto mt-10 grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center lg:gap-12'>
        <div className='relative z-10'>
          <h1 className='mt-2 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl md:text-6xl'>
            Mahsulotlarga{' '}
            <span className='bg-gradient-to-r from-sky-600 via-sky-500 to-amber-500 bg-clip-text text-transparent'>
              jonli ko'rinish
            </span>{' '}
            bilan dizayn bering
          </h1>

          <p className='mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl'>
            Rasm yuklang va mahsulotda qanday ko'rinishini darhol ko'ring.
          </p>

          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <button
              type='button'
              onClick={() => scrollToId('products')}
              className='inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-slate-700'
            >
              Mahsulotlarni ko'rish
              <ArrowRight className='h-4 w-4' />
            </button>

            <button
              type='button'
              onClick={() => scrollToId('how-it-works')}
              className='inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'
            >
              Qanday ishlashini ko'rish
            </button>
          </div>

          <div className='mt-10 flex flex-wrap gap-3 text-sm font-medium text-slate-600'>
            <span className='rounded-full border border-sky-100 bg-white px-4 py-2 shadow-sm shadow-sky-100/60'>
              Futbolka, krujka va xarid sumkasi
            </span>
            <span className='rounded-full border border-sky-100 bg-white px-4 py-2 shadow-sm shadow-sky-100/60'>
              Jonli mahsulot ko'rinishi
            </span>
            <span className='rounded-full border border-sky-100 bg-white px-4 py-2 shadow-sm shadow-sky-100/60'>
              Kompyuter va mobilga mos
            </span>
          </div>
        </div>

        <div className='relative min-h-[500px] sm:min-h-[620px]'>
          <div className='absolute inset-4 rounded-[2.75rem] border border-white/60 bg-white/35 backdrop-blur-sm' />
          <div className='absolute left-8 top-8 h-24 w-24 rounded-full bg-amber-200/70 blur-2xl' />
          <div className='absolute right-10 top-16 h-32 w-32 rounded-full bg-sky-200/70 blur-3xl' />
          <div className='absolute bottom-20 left-14 h-28 w-28 rounded-full bg-orange-200/60 blur-3xl' />

          <FloatingProductCard
            className='left-0 top-4 z-10 w-[13.25rem] sm:w-[16rem] lg:w-[19rem]'
            motionClassName='hero-float-left'
            tiltClassName='-rotate-[9deg]'
            badge='Futbolka'
            note='Old bosma'
            src='/products/t-shirt/front.jpg'
            surfaceClassName='bg-[linear-gradient(150deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.96)_48%,_rgba(254,243,199,0.92)_100%)]'
            ornamentClassName='bg-[radial-gradient(circle_at_22%_18%,_rgba(255,255,255,0.88),_transparent_24%),radial-gradient(circle_at_82%_78%,_rgba(14,165,233,0.16),_transparent_28%)]'
            imageClassName='object-contain p-5 drop-shadow-[0_28px_28px_rgba(15,23,42,0.16)] scale-[1.03]'
          >
            <div className='absolute left-[34%] top-[23%] z-[2] h-[42%] w-[32%] overflow-hidden rounded-[1rem] border border-white/55 shadow-[0_22px_28px_-16px_rgba(15,23,42,0.55)]'>
              <AppImage
                src={HERO_SISTERS_PHOTO}
                alt=''
                fill
                priority
                referrerPolicy='no-referrer'
                className='object-cover object-center'
              />
              <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.04)_0%,_rgba(15,23,42,0.08)_100%)]' />
            </div>
            <div className='pointer-events-none absolute left-[34%] top-[23%] z-[2] h-[42%] w-[32%] rounded-[1rem] border border-white/55' />
          </FloatingProductCard>

          <FloatingProductCard
            className='bottom-0 right-0 z-[1] w-[11.75rem] sm:w-[15.75rem] lg:bottom-6 lg:right-4 lg:w-[18.5rem]'
            motionClassName='hero-float-soft'
            tiltClassName='rotate-[7deg]'
            badge='Futbolka'
            note="Haqiqiy ko'rinish"
            src='/products/t-shirt/on_human.jpg'
            surfaceClassName='bg-[linear-gradient(155deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.95)_48%,_rgba(255,247,237,0.92)_100%)]'
            ornamentClassName='bg-[radial-gradient(circle_at_20%_18%,_rgba(255,255,255,0.96),_transparent_22%),radial-gradient(circle_at_80%_82%,_rgba(251,146,60,0.12),_transparent_28%)]'
            imageClassName='object-cover object-center'
            frameClassName='border-white/80'
          >
            <div className='absolute left-[40%] top-[34%] z-[2] flex h-[18%] w-[18%] items-center justify-center rounded-full border border-orange-200/40 bg-[linear-gradient(135deg,_#fb923c_0%,_#f97316_55%,_#ef4444_100%)] text-[8px] font-black uppercase tracking-[0.16em] text-white shadow-[0_18px_24px_-16px_rgba(249,115,22,0.78)]'>
              brand
            </div>
          </FloatingProductCard>
        </div>
      </div>
    </section>
  );
}
