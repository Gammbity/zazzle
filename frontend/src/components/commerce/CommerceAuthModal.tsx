import { useState } from 'react';
import Modal from '@/components/Modal';
import {
  getCommerceErrorMessage,
  loginCustomer,
  registerCustomer,
  type CommerceUser,
} from '@/lib/commerce';

interface CommerceAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (user: CommerceUser) => void;
}

type AuthMode = 'login' | 'register';

const INITIAL_LOGIN = {
  email: '',
  password: '',
};

const INITIAL_REGISTER = {
  username: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  display_name: '',
  email: '',
  password: '',
};

export default function CommerceAuthModal({
  open,
  onClose,
  onSuccess,
}: CommerceAuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN);
  const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const user = await loginCustomer(loginForm);
      onSuccess?.(user);
      handleClose();
    } catch (authError: unknown) {
      setError(
        getCommerceErrorMessage(authError, 'Kirishda xatolik yuz berdi.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const user = await registerCustomer(registerForm);
      onSuccess?.(user);
      handleClose();
    } catch (authError: unknown) {
      setError(
        getCommerceErrorMessage(
          authError,
          "Ro'yxatdan o'tishda xatolik yuz berdi.",
          ['email', 'password', 'username']
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title='Davom etish uchun hisobga kiring'
      maxWidth='max-w-3xl'
    >
      <div className='grid gap-6 md:grid-cols-[0.9fr_1.1fr]'>
        <div className='rounded-[1.75rem] bg-[linear-gradient(160deg,_#0f172a_0%,_#1e293b_58%,_#0ea5e9_100%)] p-6 text-white'>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-sky-200'>
            Commerce
          </p>
          <h3 className='mt-4 text-2xl font-semibold'>
            Savat, buyurtma va to&apos;lov bir joyda
          </h3>
          <p className='mt-3 text-sm leading-6 text-slate-200'>
            Hisob bilan kirganingizdan keyin dizaynlaringiz savatda saqlanadi,
            buyurtmalar tarixida ko&apos;rinadi va to&apos;lov holati
            kuzatiladi.
          </p>

          <div className='mt-6 space-y-3 text-sm text-slate-100'>
            <div className='rounded-2xl border border-white/10 bg-white/10 px-4 py-3'>
              Dizayn savatga backend draft sifatida yoziladi.
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/10 px-4 py-3'>
              Checkoutdan keyin order raqami va status tarixi saqlanadi.
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/10 px-4 py-3'>
              Payme, Click yoki Uzcard/Humo uchun to&apos;lov init qilinadi.
            </div>
          </div>
        </div>

        <div>
          <div className='inline-flex rounded-full bg-slate-100 p-1'>
            <button
              type='button'
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Kirish
            </button>
            <button
              type='button'
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Ro&apos;yxatdan o&apos;tish
            </button>
          </div>

          {error && (
            <div className='mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form className='mt-5 space-y-4' onSubmit={handleLogin}>
              <label className='block'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Email
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  type='email'
                  value={loginForm.email}
                  onChange={event =>
                    setLoginForm(prev => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className='block'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Parol
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  type='password'
                  value={loginForm.password}
                  onChange={event =>
                    setLoginForm(prev => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <button
                type='submit'
                disabled={submitting}
                className='w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {submitting ? 'Tekshirilmoqda...' : 'Hisobga kirish'}
              </button>
            </form>
          ) : (
            <form
              className='mt-5 grid gap-4 sm:grid-cols-2'
              onSubmit={handleRegister}
            >
              <label className='block sm:col-span-1'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Ism
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  value={registerForm.first_name}
                  onChange={event =>
                    setRegisterForm(prev => ({
                      ...prev,
                      first_name: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className='block sm:col-span-1'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Familiya
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  value={registerForm.last_name}
                  onChange={event =>
                    setRegisterForm(prev => ({
                      ...prev,
                      last_name: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className='block sm:col-span-1'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Username
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  value={registerForm.username}
                  onChange={event =>
                    setRegisterForm(prev => ({
                      ...prev,
                      username: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className='block sm:col-span-1'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Ko&apos;rinadigan ism
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  value={registerForm.display_name}
                  onChange={event =>
                    setRegisterForm(prev => ({
                      ...prev,
                      display_name: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className='block sm:col-span-2'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Email
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  type='email'
                  value={registerForm.email}
                  onChange={event =>
                    setRegisterForm(prev => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className='block sm:col-span-1'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Telefon
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  value={registerForm.phone_number}
                  onChange={event =>
                    setRegisterForm(prev => ({
                      ...prev,
                      phone_number: event.target.value,
                    }))
                  }
                  placeholder='+998 90 123 45 67'
                  required
                />
              </label>

              <label className='block sm:col-span-1'>
                <span className='mb-1 block text-sm font-medium text-slate-700'>
                  Parol
                </span>
                <input
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-300'
                  type='password'
                  value={registerForm.password}
                  onChange={event =>
                    setRegisterForm(prev => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  minLength={8}
                  required
                />
              </label>

              <button
                type='submit'
                disabled={submitting}
                className='w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2'
              >
                {submitting ? 'Yuborilmoqda...' : 'Hisob yaratish'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
