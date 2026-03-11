import { Link } from '@/lib/router';

export default function NotFoundPage() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center'>
      <p className='text-sm font-semibold uppercase tracking-[0.3em] text-primary-600'>
        404
      </p>
      <h1 className='text-3xl font-bold text-gray-900'>Page not found</h1>
      <p className='max-w-md text-gray-500'>
        The page you requested does not exist in the React version of this
        frontend.
      </p>
      <Link
        to='/'
        className='rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700'
      >
        Go home
      </Link>
    </main>
  );
}
