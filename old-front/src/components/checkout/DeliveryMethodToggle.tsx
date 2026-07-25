import { Store, Truck } from 'lucide-react';

export type DeliveryMethod = 'DELIVERY' | 'PICKUP';

interface DeliveryMethodToggleProps {
  value: DeliveryMethod;
  onChange: (value: DeliveryMethod) => void;
}

const OPTIONS: Array<{
  value: DeliveryMethod;
  title: string;
  description: string;
  icon: typeof Truck;
}> = [
  {
    value: 'DELIVERY',
    title: 'Yetkazib berish',
    description: 'Manzilingizga yetkazib beramiz.',
    icon: Truck,
  },
  {
    value: 'PICKUP',
    title: 'Kelib olib ketish',
    description: "Do'kondan o'zingiz olib ketasiz.",
    icon: Store,
  },
];

export default function DeliveryMethodToggle({
  value,
  onChange,
}: DeliveryMethodToggleProps) {
  return (
    <div className='grid gap-2.5 sm:grid-cols-2'>
      {OPTIONS.map(option => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value)}
            className={`rounded-2xl border p-4 text-left transition ${
              active
                ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                : 'border-stone-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'
            }`}
          >
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-stone-100 text-slate-500'
                  }`}
                >
                  <Icon className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-sm font-semibold text-slate-900'>
                    {option.title}
                  </p>
                  <p className='mt-0.5 text-xs text-slate-500'>
                    {option.description}
                  </p>
                </div>
              </div>
              <div
                className={`h-4 w-4 shrink-0 rounded-full border-2 transition ${
                  active ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                }`}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
