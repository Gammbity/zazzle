'use client';

import AppImage from '@/components/AppImage';
import { STICKER_ASSETS, type StickerAsset } from '@/types/layer';
import { cn } from '@/lib/utils';

interface StickerPickerProps {
  onSelect: (sticker: StickerAsset) => void;
  onClose: () => void;
}

/**
 * Grid of sticker thumbnails.
 * Rendered inside a modal or inline panel.
 */
export default function StickerPicker({
  onSelect,
  onClose,
}: StickerPickerProps) {
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-sm text-slate-500'>
        Kerakli stiker ustiga bosing va u avtomatik ravishda dizaynga
        qo'shiladi.
      </p>

      <div className='grid grid-cols-4 gap-3 sm:grid-cols-6'>
        {STICKER_ASSETS.map(s => (
          <button
            key={s.id}
            onClick={() => {
              onSelect(s);
              onClose();
            }}
            className={cn(
              'group flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3',
              'transition-all hover:border-sky-300 hover:bg-sky-50 hover:shadow-sm',
              'outline-none focus-visible:ring-2 focus-visible:ring-sky-500'
            )}
            aria-label={`${s.label} stikerini qo'shish`}
          >
            <div className='relative h-10 w-10'>
              <AppImage
                src={s.src}
                alt={s.label}
                fill
                className='object-contain transition-transform group-hover:scale-110'
                unoptimized
              />
            </div>
            <span className='text-[10px] font-medium text-slate-500 group-hover:text-sky-700'>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
