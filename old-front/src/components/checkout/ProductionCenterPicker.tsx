import { useEffect, useRef, useState } from 'react';
import { Factory, MapPin, Navigation, Store } from 'lucide-react';
import { useProductionCenters } from '@/hooks/queries';
import type { DeliveryMethod } from '@/components/checkout/DeliveryMethodToggle';

type Mode = 'auto' | 'manual';

interface ProductionCenterPickerProps {
  deliveryMethod: DeliveryMethod;
  value: number | null;
  onChange: (id: number | null) => void;
}

export default function ProductionCenterPicker({
  deliveryMethod,
  value,
  onChange,
}: ProductionCenterPickerProps) {
  const [mode, setMode] = useState<Mode>('auto');
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDenied, setGeoDenied] = useState(false);
  const autoAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position =>
        setGeo({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => setGeoDenied(true),
      { timeout: 8000 }
    );
  }, []);

  const centersQuery = useProductionCenters({
    delivery_method: deliveryMethod,
    lat: geo?.lat,
    lng: geo?.lng,
  });
  const centers = centersQuery.data ?? [];

  useEffect(() => {
    if (mode !== 'auto' || centers.length === 0) return;
    const applyKey = `${deliveryMethod}:${centers[0].id}`;
    if (autoAppliedRef.current === applyKey) return;
    autoAppliedRef.current = applyKey;
    onChange(centers[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, deliveryMethod, centers]);

  const Icon = deliveryMethod === 'PICKUP' ? Store : Factory;

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-sm font-medium text-slate-700'>
          Ishlab chiqarish markazi <span className='text-amber-600'>*</span>
        </span>
        <div className='inline-flex rounded-2xl border border-stone-200 p-1'>
          <button
            type='button'
            onClick={() => setMode('auto')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'auto'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-stone-50'
            }`}
          >
            <Navigation className='h-3.5 w-3.5' />
            Avtomatik (eng yaqini)
          </button>
          <button
            type='button'
            onClick={() => setMode('manual')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'manual'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-stone-50'
            }`}
          >
            <MapPin className='h-3.5 w-3.5' />
            O&apos;zim tanlayman
          </button>
        </div>
      </div>

      {geoDenied && (
        <p className='mt-1.5 text-xs text-slate-400'>
          Joylashuvingizni aniqlab bo&apos;lmadi — markazlar tartib
          bo&apos;yicha ko&apos;rsatilmoqda.
        </p>
      )}

      <div className='mt-3'>
        {centersQuery.isLoading ? (
          <div className='h-20 animate-pulse rounded-2xl bg-amber-50' />
        ) : centers.length === 0 ? (
          <p className='rounded-2xl border border-dashed border-amber-200 bg-amber-50/30 p-4 text-sm text-slate-500'>
            Hozircha mos ishlab chiqarish markazi mavjud emas.
          </p>
        ) : (
          <div className='space-y-2.5'>
            {centers.map(center => {
              const selected = value === center.id;
              return (
                <button
                  key={center.id}
                  type='button'
                  onClick={() => {
                    setMode('manual');
                    onChange(center.id);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200'
                      : 'border-stone-200 bg-white hover:border-amber-200'
                  }`}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-start gap-3'>
                      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700'>
                        <Icon className='h-4 w-4' />
                      </div>
                      <div>
                        <p className='text-sm font-semibold text-slate-900'>
                          {center.name}
                        </p>
                        <p className='mt-0.5 text-sm text-slate-600'>
                          {center.address}
                        </p>
                      </div>
                    </div>
                    {center.distance_km != null && (
                      <span className='shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-slate-600'>
                        {center.distance_km} km
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
