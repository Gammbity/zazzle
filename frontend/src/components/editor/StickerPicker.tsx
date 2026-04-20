import { useMemo, useState } from 'react';
import AppImage from '@/components/AppImage';
import { STICKER_ASSETS, type StickerAsset } from '@/types/layer';
import { cn } from '@/lib/utils';

interface StickerPickerProps {
  onSelect: (sticker: StickerAsset) => void;
  onClose: () => void;
}

export default function StickerPicker({
  onSelect,
  onClose,
}: StickerPickerProps) {
  const [activeStickerId, setActiveStickerId] = useState(
    STICKER_ASSETS[0]?.id ?? ''
  );

  const activeSticker = useMemo(
    () =>
      STICKER_ASSETS.find(sticker => sticker.id === activeStickerId) ??
      STICKER_ASSETS[0],
    [activeStickerId]
  );

  return (
    <div className='flex flex-col gap-4'>
      <div className='grid gap-4 lg:grid-cols-[0.95fr_1.05fr]'>
        {activeSticker && (
          <div className='rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#ffffff_100%)] p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.26em] text-sky-700'>
              Kattaroq ko'rinish
            </p>

            <div className='mt-4 flex items-center gap-4'>
              <div className='relative flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.4rem] bg-white shadow-sm shadow-slate-200/70'>
                <AppImage
                  src={activeSticker.src}
                  alt={activeSticker.label}
                  fill
                  className='object-contain p-4'
                  unoptimized
                />
              </div>

              <div>
                <h3 className='text-xl font-semibold text-slate-900'>
                  {activeSticker.label}
                </h3>
                <p className='mt-2 text-sm leading-6 text-slate-600'>
                  {activeSticker.description}
                </p>
              </div>
            </div>

            <div className='mt-5 rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-600'>
              Tanlangandan keyin stiker chop hududining markaziga qo'shiladi.
              Keyin uni sudrab yoki kattalashtirib aniq joylashtirasiz.
            </div>
          </div>
        )}

        <div>
          <div className='mb-3 flex items-center justify-between gap-3'>
            <p className='text-sm text-slate-500'>
              Kattaroq ko'rish uchun ustiga olib boring, qo'shish uchun bosing.
            </p>
            <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'>
              {STICKER_ASSETS.length} ta stiker
            </span>
          </div>

          <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4'>
            {STICKER_ASSETS.map(sticker => (
              <button
                key={sticker.id}
                type='button'
                onMouseEnter={() => setActiveStickerId(sticker.id)}
                onFocus={() => setActiveStickerId(sticker.id)}
                onClick={() => {
                  onSelect(sticker);
                  onClose();
                }}
                className={cn(
                  'group flex flex-col items-center gap-2 rounded-[1.2rem] border bg-slate-50 p-3 text-center',
                  'transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-sm',
                  'outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                  activeSticker?.id === sticker.id
                    ? 'border-sky-300 bg-sky-50 shadow-sm shadow-sky-100/80'
                    : 'border-slate-200'
                )}
                aria-label={`${sticker.label} stikerini qo'shish`}
              >
                <div className='relative h-16 w-16'>
                  <AppImage
                    src={sticker.src}
                    alt={sticker.label}
                    fill
                    className='object-contain transition-transform group-hover:scale-110'
                    unoptimized
                  />
                </div>

                <div>
                  <span className='block text-xs font-semibold text-slate-700 group-hover:text-sky-700'>
                    {sticker.label}
                  </span>
                  <span className='mt-1 block text-[11px] leading-4 text-slate-500'>
                    Qo'shish
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
