'use client';

import type { Layer } from '@/types/layer';
import { cn } from '@/lib/utils';

interface LayerListProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Displays the layers panel sorted by descending z-index (top layer first).
 * Pure presentation – all actions come from props.
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
    <div className='rounded-xl border border-gray-100 bg-gray-50 p-3'>
      <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400'>
        Layers ({layers.length})
      </p>
      <ul className='flex flex-col gap-1'>
        {sorted.map(layer => (
          <li
            key={layer.id}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors',
              layer.id === selectedLayerId
                ? 'bg-primary-50 font-medium text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            onClick={() => onSelect(layer.id)}
          >
            <span className='flex items-center gap-2 truncate'>
              <span className='text-[10px] uppercase text-gray-400'>
                {layer.type}
              </span>
              {layer.name}
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(layer.id);
              }}
              className='rounded p-0.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500'
              aria-label={`Delete ${layer.name}`}
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
