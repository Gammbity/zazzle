import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div
        role='alert'
        className='mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center'
      >
        <h1 className='text-2xl font-semibold text-slate-900'>
          Kutilmagan xatolik yuz berdi
        </h1>
        <p className='max-w-md text-sm leading-6 text-slate-600'>
          Sahifani qayta yuklashni yoki bosh sahifaga qaytishni sinab ko'ring.
          Muammo takrorlansa, qo'llab-quvvatlash xizmatiga murojaat qiling.
        </p>
        {import.meta.env.DEV && (
          <pre className='max-h-48 w-full overflow-auto rounded-lg bg-slate-900 p-3 text-left text-xs text-slate-100'>
            {error.message}
          </pre>
        )}
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={this.reset}
            className='rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700'
          >
            Qayta urinish
          </button>
          <button
            type='button'
            onClick={() => {
              window.location.href = '/';
            }}
            className='rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100'
          >
            Bosh sahifa
          </button>
        </div>
      </div>
    );
  }
}
