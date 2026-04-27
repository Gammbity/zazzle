import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  label?: string;
  className?: string;
  compact?: boolean;
}

export default function ImagePlaceholder({
  label = 'Rasm mavjud emas',
  className,
  compact,
}: ImagePlaceholderProps) {
  return (
    <div
      role='img'
      aria-label={label}
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_50%,_#e2e8f0_100%)] text-slate-400',
        className
      )}
    >
      <ImageOff className={cn(compact ? 'h-6 w-6' : 'h-10 w-10')} aria-hidden />
      {!compact && (
        <span className='px-4 text-center text-xs font-medium text-slate-500'>
          {label}
        </span>
      )}
    </div>
  );
}
