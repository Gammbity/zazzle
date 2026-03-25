'use client';

import { Clock3, MousePointerSquareDashed, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { HOME_BENEFITS, HOME_STEPS } from '@/lib/products/content';

const STEP_ICONS = [Upload, MousePointerSquareDashed, Sparkles] as const;
const BENEFIT_ICONS = [Sparkles, ShieldCheck, Clock3] as const;

export default function HomeConfidenceSection() {
  return (
    <section
      id='how-it-works'
      className='relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-sky-50 py-20 md:py-24'
      aria-label='Qanday ishlaydi'
    >
      <div
        className='pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl'
        aria-hidden='true'
      />
      <div
        className='pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl'
        aria-hidden='true'
      />

      <div className='relative mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl'>
          <p className='text-sm font-semibold uppercase tracking-[0.3em] text-amber-700'>
            Qanday ishlaydi
          </p>
          <h2 className='mt-4 text-3xl font-bold text-slate-900 md:text-4xl'>
            Dizayn qilish jarayonini foydalanuvchi uchun sodda qildik
          </h2>
          <p className='mt-4 max-w-2xl text-base text-slate-600 md:text-lg'>
            Tanlash, joylash, tekshirish va saqlash jarayonlari aniq ko'rinadi.
            Shuning uchun yangi foydalanuvchi ham tez moslashadi.
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-3'>
          {HOME_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[index];

            return (
              <article
                key={step.title}
                className='rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm shadow-slate-200/60 backdrop-blur'
              >
                <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white'>
                  <Icon className='h-5 w-5' />
                </div>
                <h3 className='mt-5 text-xl font-semibold text-slate-900'>
                  {step.title}
                </h3>
                <p className='mt-3 text-sm leading-6 text-slate-600'>
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className='grid gap-4 md:grid-cols-3'>
          {HOME_BENEFITS.map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index];

            return (
              <article
                key={benefit.title}
                className='rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-lg shadow-slate-900/10'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10'>
                    <Icon className='h-5 w-5 text-amber-300' />
                  </div>
                  <h3 className='text-lg font-semibold'>{benefit.title}</h3>
                </div>
                <p className='mt-4 text-sm leading-6 text-slate-300'>
                  {benefit.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
