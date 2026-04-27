import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

const ROUNDED_CLASSES: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-[1.85rem]',
  full: 'rounded-full',
};

export default function Skeleton({ className, rounded = 'xl' }: SkeletonProps) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'relative overflow-hidden bg-slate-100',
        ROUNDED_CLASSES[rounded],
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent',
        className
      )}
    />
  );
}
