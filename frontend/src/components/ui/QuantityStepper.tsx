import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  label = 'Soni',
  disabled,
  className,
}: QuantityStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const decrement = () => onChange(clamp(value - 1));
  const increment = () => onChange(clamp(value + 1));

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor='quantity-input'
        className='block text-sm font-semibold text-slate-900'
      >
        {label}
      </label>
      <div
        className={cn(
          'inline-flex items-center rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-100',
          disabled && 'opacity-50'
        )}
      >
        <button
          type='button'
          onClick={decrement}
          disabled={disabled || atMin}
          aria-label='Sonni kamaytirish'
          className='flex h-11 w-11 items-center justify-center rounded-l-xl text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:text-slate-300'
        >
          <Minus className='h-4 w-4' aria-hidden />
        </button>
        <input
          id='quantity-input'
          type='number'
          inputMode='numeric'
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={e => {
            const parsed = Number.parseInt(e.target.value, 10);
            onChange(Number.isFinite(parsed) ? clamp(parsed) : min);
          }}
          className='h-11 w-14 border-x border-slate-200 bg-transparent text-center text-sm font-semibold text-slate-900 [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          aria-label={label}
        />
        <button
          type='button'
          onClick={increment}
          disabled={disabled || atMax}
          aria-label="Sonni ko'paytirish"
          className='flex h-11 w-11 items-center justify-center rounded-r-xl text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:text-slate-300'
        >
          <Plus className='h-4 w-4' aria-hidden />
        </button>
      </div>
    </div>
  );
}
