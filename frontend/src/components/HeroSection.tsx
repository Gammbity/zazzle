'use client';

import { useCallback } from 'react';

export default function HeroSection() {
  const scrollToProducts = useCallback(() => {
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <section
      className="relative flex min-h-[50vh] flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 px-4 text-center"
      aria-label="Introduction"
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-100/40 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary-100/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-600">
          Print on Demand &bull; Uzbekistan
        </p>

        <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl md:text-6xl">
          Bring your ideas{' '}
          <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            to life
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-gray-500 sm:text-xl">
          Upload a design, pick a product, and get it printed in minutes.
          T-shirts, mugs, business cards &amp; more — made in Uzbekistan.
        </p>

        <button
          onClick={scrollToProducts}
          className="btn-primary mt-8 px-8 py-3 text-base font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
        >
          Browse Products
        </button>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 animate-bounce text-gray-400" aria-hidden="true">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
