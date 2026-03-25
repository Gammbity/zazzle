'use client';

import type { Layer } from '@/types/layer';
import { cn } from '@/lib/utils';

interface LayerListProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const LAYER_TYPE_LABELS: Record<Layer['type'], string> = {
  image: 'Rasm',
  text: 'Matn',
  sticker: 'Stiker',
};

/**
 * Displays the layers panel sorted by descending z-index (top layer first).
 * Pure presentation - all actions come from props.
 */
export default function LayerList({
  layers,
  selectedLayerId,
  onSelect,
  onDelete,
}: LayerListProps) {
  if (layers.length === 0) return null;

  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className='rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4'>
      <p className='mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400'>
        Qatlamlar
      </p>
      <p className='mb-3 text-sm text-slate-500'>
        Yuqoridagi qatlam ko'rinishda tepada ko'rinadi. Jami: {layers.length}{' '}
        ta.
      </p>
      <ul className='flex flex-col gap-1'>
        {sorted.map(layer => (
          <li
            key={layer.id}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
              layer.id === selectedLayerId
                ? 'bg-sky-50 font-medium text-sky-700'
                : 'text-slate-600 hover:bg-white'
            )}
            onClick={() => onSelect(layer.id)}
          >
            <span className='flex items-center gap-2 truncate'>
              <span className='text-[10px] uppercase tracking-[0.2em] text-slate-400'>
                {LAYER_TYPE_LABELS[layer.type]}
              </span>
              {layer.name}
            </span>
            <button
              type='button'
              onClick={event => {
                event.stopPropagation();
                onDelete(layer.id);
              }}
              className='rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500'
              aria-label={`${layer.name} qatlamini o'chirish`}
            >
              <svg
                className='h-3.5 w-3.5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
