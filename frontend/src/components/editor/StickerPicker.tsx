'use client';

import Image from 'next/image';
import { STICKER_ASSETS, type StickerAsset } from '@/lib/editor/types';
import { cn } from '@/lib/utils';

interface StickerPickerProps {
  onSelect: (sticker: StickerAsset) => void;
  onClose: () => void;
}

/**
 * Grid of sticker thumbnails.
 * Rendered inside a modal or inline panel.
 */
export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Tap a sticker to add it to your design.
      </p>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {STICKER_ASSETS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              onSelect(s);
              onClose();
            }}
            className={cn(
              'group flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-3',
              'transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm',
              'focus-visible:ring-2 focus-visible:ring-primary-500 outline-none',
            )}
            aria-label={`Add ${s.label} sticker`}
          >
            <div className="relative h-10 w-10">
              <Image
                src={s.src}
                alt={s.label}
                fill
                className="object-contain transition-transform group-hover:scale-110"
                unoptimized
              />
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-primary-600">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
