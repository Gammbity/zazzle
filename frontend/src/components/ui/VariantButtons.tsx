import { cn } from '@/lib/utils';

export interface VariantOption {
  value: string;
  label?: string;
  disabled?: boolean;
  helperText?: string;
}

interface VariantButtonsProps {
  options: VariantOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  name: string;
  className?: string;
}

export default function VariantButtons({
  options,
  value,
  onChange,
  label,
  name,
  className,
}: VariantButtonsProps) {
  if (options.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-semibold text-slate-900'>{label}</span>
        {value && (
          <span className='text-xs text-slate-500'>
            Tanlangan:{' '}
            <span className='font-medium text-slate-800'>{value}</span>
          </span>
        )}
      </div>

      <div
        role='radiogroup'
        aria-label={label}
        className='flex flex-wrap gap-2'
      >
        {options.map(option => {
          const selected = option.value === value;
          const displayLabel = option.label ?? option.value;
          return (
            <button
              key={option.value}
              type='button'
              role='radio'
              aria-checked={selected}
              aria-disabled={option.disabled}
              disabled={option.disabled}
              name={name}
              title={option.helperText ?? displayLabel}
              onClick={() => !option.disabled && onChange(option.value)}
              className={cn(
                'min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1',
                selected
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-stone-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50',
                option.disabled &&
                  'pointer-events-none cursor-not-allowed border-dashed border-stone-200 bg-stone-50 text-slate-400 line-through'
              )}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
