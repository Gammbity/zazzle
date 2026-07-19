import { useState, type FormEvent } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useLogin } from '@/hooks/queries';
import { getCommerceErrorMessage } from '@/lib/commerce';

export default function AdminLoginGate() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLogin();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch (authError: unknown) {
      setError(
        getCommerceErrorMessage(authError, 'Kirishda xatolik yuz berdi.')
      );
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-brand-bg px-4'>
      <div className='w-full max-w-sm rounded-[1.75rem] border border-stone-200 bg-white p-8 shadow-xl shadow-amber-100/40'>
        <div className='flex flex-col items-center text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-brand shadow-sm shadow-brand/20'>
            <span className='text-lg font-black text-white'>Z</span>
          </div>
          <p className='mt-4 text-sm font-extrabold text-brand'>Zazzle</p>
          <p className='text-[10px] font-medium uppercase tracking-wider text-brand-muted'>
            Admin panel
          </p>
          <h1 className='mt-4 text-xl font-semibold text-slate-900'>
            Admin panelga kirish
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Davom etish uchun ish hisobingiz bilan tizimga kiring.
          </p>
        </div>

        {error && (
          <div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            {error}
          </div>
        )}

        <form className='mt-6 space-y-4' onSubmit={handleSubmit}>
          <label className='block'>
            <span className='mb-1 block text-sm font-medium text-slate-700'>
              Email
            </span>
            <input
              className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-300'
              type='email'
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoFocus
              required
            />
          </label>

          <label className='block'>
            <span className='mb-1 block text-sm font-medium text-slate-700'>
              Parol
            </span>
            <input
              className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-amber-300'
              type='password'
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
            />
          </label>

          <button
            type='submit'
            disabled={loginMutation.isPending}
            className='flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Tekshirilmoqda...
              </>
            ) : (
              <>
                <ShieldCheck className='h-4 w-4' />
                Hisobga kirish
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
