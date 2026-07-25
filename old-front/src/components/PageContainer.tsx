import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Shared page shell for standard (store) content pages — keeps the same
// max-width and side padding everywhere instead of each page redefining it.
export default function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className='min-h-screen bg-brand-bg px-4 py-10 sm:px-6 lg:px-8'>
      <div className={cn('mx-auto max-w-7xl', className)}>{children}</div>
    </main>
  );
}
