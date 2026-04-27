import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColorOption {
  name: string;
  hex: string;
  disabled?: boolean;
}

interface ColorSwatchesProps {
  options: ColorOption[];
  value: string;
  onChange: (name: string) => void;
  label?: string;
  className?: string;
}

function isLight(hex: string): boolean {
  const match = hex
    .replace('#', '')
    .match(/^([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!match) return false;
  const [, r, g, b] = match;
  const luminance =
    (0.299 * parseInt(r, 16) +
      0.587 * parseInt(g, 16) +
      0.114 * parseInt(b, 16)) /
    255;
  return luminance > 0.7;
}

export default function ColorSwatches({
  options,
  value,
  onChange,
  label = 'Rang',
  className,
}: ColorSwatchesProps) {
  if (options.length === 0) return null;

  const selected = options.find(o => o.name === value);

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-semibold text-slate-900'>{label}</span>
        {selected && (
          <span className='text-xs text-slate-500'>
            Tanlangan:{' '}
            <span className='font-medium text-slate-800'>{selected.name}</span>
          </span>
        )}
      </div>

      <div
        role='radiogroup'
        aria-label={label}
        className='flex flex-wrap gap-2.5'
      >
        {options.map(option => {
          const isSelected = option.name === value;
          const light = isLight(option.hex);
          return (
            <button
              key={option.name}
              type='button'
              role='radio'
              aria-checked={isSelected}
              aria-label={option.name}
              aria-disabled={option.disabled}
              disabled={option.disabled}
              title={option.name}
              onClick={() => !option.disabled && onChange(option.name)}
              className={cn(
                'relative h-10 w-10 rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2',
                isSelected
                  ? 'scale-110 border-slate-900 shadow-md shadow-slate-900/20'
                  : 'border-white ring-1 ring-slate-200 hover:scale-105 hover:ring-slate-300',
                option.disabled &&
                  'pointer-events-none cursor-not-allowed opacity-40'
              )}
              style={{ backgroundColor: option.hex }}
            >
              {isSelected && (
                <Check
                  className={cn(
                    'absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2',
                    light ? 'text-slate-900' : 'text-white'
                  )}
                  strokeWidth={3}
                  aria-hidden
                />
              )}
              {option.disabled && (
                <span
                  aria-hidden
                  className='absolute inset-0 rounded-full bg-[linear-gradient(135deg,transparent_45%,rgba(100,116,139,0.6)_48%,rgba(100,116,139,0.6)_52%,transparent_55%)]'
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
