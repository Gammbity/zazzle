'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import AppImage from '@/components/AppImage';

const categoryItems = [
  {
    label: 'Futbolka',
    slug: 't-shirt',
    image: '/generated/category-tshirt-v2-trimmed.png',
    className: 'h-[72px] w-[82px]',
  },
  {
    label: 'Krujka',
    slug: 'mug',
    image: '/products/mug/right.jpg',
    className: 'h-[66px] w-[76px]',
  },
  {
    label: 'Vizitka',
    slug: 'business-card',
    image: '/generated/business-card.png',
    className: 'h-[56px] w-[78px]',
  },
  {
    label: 'Ruchka',
    slug: 'pen',
    image: '/generated/pen.png',
    className: 'h-[72px] w-[34px]',
  },
  {
    label: 'Stol kalendari',
    slug: 'desk-calendar',
    image: '/generated/calendar.png',
    className: 'h-[70px] w-[78px]',
  },
  {
    label: 'Hoodie',
    slug: 'hoodie',
    image: '/generated/hoodie.png',
    className: 'h-[76px] w-[82px]',
  },
] as const;

const activityItems = [
  {
    time: '2 daqiqa oldin',
    text: 'Azizbek futbolka buyurtma qildi',
    avatarPosition: '0% center',
  },
  {
    time: '5 daqiqa oldin',
    text: 'Madina krujka dizaynini yakunladi',
    avatarPosition: '50% center',
  },
  {
    time: '12 daqiqa oldin',
    text: 'Sardor vizitka buyurtma berdi',
    avatarPosition: '100% center',
  },
] as const;

function CategorySlider() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showNext, setShowNext] = useState(false);

  const updateOverflow = useCallback(() => {
    const element = scrollerRef.current;
    if (!element) return;
    setShowNext(
      element.scrollLeft + element.clientWidth < element.scrollWidth - 6
    );
  }, []);

  useEffect(() => {
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    if (scrollerRef.current) observer.observe(scrollerRef.current);
    return () => observer.disconnect();
  }, [updateOverflow]);

  return (
    <section
      aria-label='Mahsulot kategoriyalari'
      className='relative mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8'
    >
      <div
        ref={scrollerRef}
        onScroll={updateOverflow}
        className='scrollbar-none snap-x snap-mandatory overflow-x-auto rounded-[20px] bg-white shadow-[0_13px_30px_-20px_rgba(68,37,17,.35)]'
      >
        <div className='flex h-[90px] min-w-max divide-x divide-[#f1ebe5] lg:min-w-0'>
          {categoryItems.map(item => (
            <Link
              key={item.label}
              href={`/products/${item.slug}`}
              className='group flex flex-1 snap-start items-center justify-center overflow-hidden bg-white px-4 transition hover:bg-[#fffaf5]'
            >
              {item.label === 'Vizitka' ? (
                <span className='relative block h-[38px] w-[70px]'>
                  <span className='absolute inset-x-1 bottom-0 h-[32px] skew-x-[-5deg] rounded-[2px] bg-[#eeeae5] shadow-sm' />
                  <span className='absolute inset-x-0 top-0 h-[34px] rounded-[2px] bg-white shadow-[0_5px_10px_rgba(57,41,29,.15)] ring-1 ring-[#f1ede8]' />
                </span>
              ) : (
                <AppImage
                  src={item.image}
                  alt={item.label}
                  className={`${item.className} object-contain transition duration-300 group-hover:scale-105`}
                />
              )}
              <span className='sr-only'>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {showNext && (
        <button
          type='button'
          aria-label='Keyingi mahsulotlarni ko‘rish'
          onClick={() =>
            scrollerRef.current?.scrollBy({
              left: scrollerRef.current.clientWidth * 0.82,
              behavior: 'smooth',
            })
          }
          className='absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#a94f07] shadow-lg ring-1 ring-[#f0e8df] lg:hidden'
        >
          <ChevronRight className='h-5 w-5' />
        </button>
      )}
    </section>
  );
}

export default function ReferenceLandingPage() {
  return (
    <div className='overflow-hidden bg-[#fcfaf8] text-[#171411]'>
      <section className='mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex w-full flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-4'>
            <h1 className='text-[40px] font-extrabold leading-[.99] tracking-[-0.058em] sm:text-[46px] lg:text-[39px] xl:text-[50px] 2xl:text-[56px]'>
              <span className='block lg:whitespace-nowrap'>
                Rasmingizni yuklang.
              </span>
              <span className='block lg:whitespace-nowrap'>
                Dizaynni yarating.
              </span>
              <span className='block text-[#c26312] lg:whitespace-nowrap'>
                Buyurtma bering.
              </span>
            </h1>

            <p className='mt-[19px] max-w-[430px] text-[13px] leading-[21px] text-[#5e554e] xl:max-w-[520px] xl:text-[15px] xl:leading-6'>
              Futbolka, krujka, vizitka va boshqa mahsulotlarda dizayningizni
              jonli ko‘rinishini oldindan ko‘ring.
            </p>

            <div className='mt-[19px] flex flex-col gap-[10px] sm:flex-row'>
              <Link
                href='/#products'
                className='inline-flex h-[39px] items-center justify-center gap-3 rounded-[10px] bg-[#bd620d] px-[22px] text-[10px] font-bold text-white shadow-[0_11px_22px_-13px_#7f3900] xl:h-[44px] xl:text-[12px]'
              >
                Dizayn yaratishni boshlash{' '}
                <ArrowRight className='h-3.5 w-3.5' />
              </Link>
              <a
                href='#customers'
                className='inline-flex h-[39px] items-center justify-center rounded-[10px] bg-white px-[22px] text-[10px] font-bold text-[#a94f07] ring-1 ring-[#eee5dc] xl:h-[44px] xl:text-[12px]'
              >
                Namunalarni ko‘rish
              </a>
            </div>

            <div className='scrollbar-none overflow-x-auto rounded-[15px] bg-white shadow-[0_11px_26px_-19px_rgba(72,38,16,.45)] ring-1 ring-[#f2ebe4] lg:overflow-hidden'>
              <div className='grid grid-cols-3  p-[7px] lg:p-[6px]'>
                {activityItems.map((item, index) => (
                  <div
                    key={item.text}
                    className='flex w-[210px] snap-start items-center gap-[9px] px-[7px] py-[4px] lg:w-auto lg:min-w-0 lg:px-[6px]'
                  >
                    <span className='relative h-[38px] w-[38px] shrink-0 overflow-visible rounded-full'>
                      <span
                        className='block h-full w-full rounded-full bg-cover bg-no-repeat'
                        style={{
                          backgroundImage:
                            "url('/generated/activity-avatars-v2.png')",
                          backgroundPosition: item.avatarPosition,
                          backgroundSize: '300% 100%',
                        }}
                      />
                      <span className='absolute bottom-[-1px] right-[-1px] h-[9px] w-[9px] rounded-full bg-[#16c63b] ring-2 ring-white' />
                    </span>
                    <span className='min-w-0 text-[9px] leading-[13px] text-[#4d4640] xl:text-[10px] xl:leading-[14px]'>
                      <strong className='block whitespace-nowrap font-semibold text-[#71675e]'>
                        {item.time}
                      </strong>
                      <span className='block max-w-[105px] text-[#322d29] lg:max-w-none'>
                        {item.text}
                      </span>
                    </span>
                    {index < activityItems.length - 1 && (
                      <span className='ml-auto hidden h-8 w-px bg-[#f0e9e2] lg:block' />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className=' relative flex flex-1 items-center '>
            <AppImage
              src='/generated/tshirt-v3-trimmed.png'
              alt='Adventure Awaits dizaynli futbolka'
              priority
              className='absolute bottom-1/2 left-1/2 w-[35%] translate-y-1/2 object-contain drop-shadow-[0_18px_20px_rgba(67,42,24,.18)]'
            />
            <AppImage
              src='/generated/mug-v2-trimmed.png'
              alt='Adventure Awaits dizaynli krujka'
              priority
              className='absolute bottom-1/2 left-1/3 w-[30%] translate-y-1/2  object-contain drop-shadow-[0_13px_14px_rgba(67,42,24,.2)]'
            />
            <AppImage
              src='/generated/phone-v2-trimmed.png'
              alt='Futbolka previewi tushirilgan telefon'
              priority
              className='absolute bottom-1/2 right-0 w-[30%] translate-y-1/2  object-contain drop-shadow-[0_19px_16px_rgba(31,22,16,.3)]'
            />
          </div>
        </div>
      </section>

      <CategorySlider />

      <section
        id='products'
        className='mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8'
      >
        <div className='flex items-end justify-between'>
          <h2 className='text-3xl font-extrabold tracking-[-0.04em]'>
            Mashhur mahsulotlar
          </h2>
          <Link
            href='/#products'
            className='hidden items-center gap-2 text-sm font-bold text-[#a94f07] sm:inline-flex'
          >
            Barchasini ko‘rish <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      </section>
      <span id='how-it-works' />
      <span id='customers' />
      <span id='stats' />
      <span id='faq' />
    </div>
  );
}
