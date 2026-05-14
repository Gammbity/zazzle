'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-9 w-9" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-900">
        Kutilmagan xato yuz berdi
      </h1>
      <p className="mt-3 max-w-md text-ink-600">
        Texnik xato sodir bo‘ldi. Iltimos, qayta urinib ko‘ring. Muammo davom etsa — biz bilan
        bog‘laning.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-ink-500">Xato kodi: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
      >
        <RefreshCw className="h-4 w-4" /> Qayta urinish
      </button>
    </section>
  );
}
