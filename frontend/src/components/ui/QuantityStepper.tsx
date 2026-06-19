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
    <div className={cn('inline-flex items-center rounded-lg border border-stone-200 bg-white', disabled && 'opacity-50', className)}>
      <button
        type='button'
        onClick={decrement}
        disabled={disabled || atMin}
        aria-label='Kamaytirish'
        className='flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:text-stone-300 focus-visible:outline-none'
      >
        <Minus className='h-3.5 w-3.5' />
      </button>
      <input
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
        className='h-8 w-10 border-x border-stone-200 bg-transparent text-center text-sm font-semibold text-slate-900 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
        aria-label={label}
      />
      <button
        type='button'
        onClick={increment}
        disabled={disabled || atMax}
        aria-label="Ko'paytirish"
        className='flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-amber-700 disabled:cursor-not-allowed disabled:text-stone-300 focus-visible:outline-none'
      >
        <Plus className='h-3.5 w-3.5' />
      </button>
    </div>
  );
}
