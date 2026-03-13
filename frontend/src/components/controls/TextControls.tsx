'use client';

import { cn } from '@/lib/utils';
import type { TextLayer } from '@/types/layer';
import { FONT_FAMILIES } from '@/types/layer';

interface TextControlsProps {
  layer: TextLayer;
  onUpdate: (attrs: Partial<TextLayer>) => void;
}

/**
 * Inline toolbar for editing a selected text layer.
 * Pure presentation – receives the layer and an update callback.
 */
export default function TextControls({ layer, onUpdate }: TextControlsProps) {
  return (
    <div className='flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3'>
      {/* Text content */}
      <input
        type='text'
        value={layer.text}
        onChange={e => onUpdate({ text: e.target.value })}
        className='w-40 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400'
        placeholder='Enter text'
      />

      {/* Font family */}
      <select
        value={layer.fontFamily}
        onChange={e => onUpdate({ fontFamily: e.target.value })}
        className='rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none'
      >
        {FONT_FAMILIES.map(f => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      {/* Font size */}
      <input
        type='number'
        min={8}
        max={200}
        value={layer.fontSize}
        onChange={e => onUpdate({ fontSize: Number(e.target.value) })}
        className='w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none'
      />

      {/* Color */}
      <input
        type='color'
        value={layer.fill}
        onChange={e => onUpdate({ fill: e.target.value })}
        className='h-8 w-8 cursor-pointer rounded border border-gray-200'
      />

      {/* Bold */}
      <button
        onClick={() => {
          const isBold = layer.fontStyle?.includes('bold');
          const newStyle = isBold
            ? (layer.fontStyle
                ?.replace('bold', '')
                .trim() as TextLayer['fontStyle'])
            : (`bold ${layer.fontStyle ?? ''}`.trim() as TextLayer['fontStyle']);
          onUpdate({ fontStyle: newStyle });
        }}
        className={cn(
          'rounded-lg border px-2.5 py-1.5 text-sm font-bold transition-colors',
          layer.fontStyle?.includes('bold')
            ? 'border-primary-400 bg-primary-50 text-primary-700'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
        )}
        aria-label='Toggle bold'
      >
        B
      </button>

      {/* Italic */}
      <button
        onClick={() => {
          const isItalic = layer.fontStyle?.includes('italic');
          const newStyle = isItalic
            ? (layer.fontStyle
                ?.replace('italic', '')
                .trim() as TextLayer['fontStyle'])
            : (`${layer.fontStyle ?? ''} italic`.trim() as TextLayer['fontStyle']);
          onUpdate({ fontStyle: newStyle });
        }}
        className={cn(
          'rounded-lg border px-2.5 py-1.5 text-sm italic transition-colors',
          layer.fontStyle?.includes('italic')
            ? 'border-primary-400 bg-primary-50 text-primary-700'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
        )}
        aria-label='Toggle italic'
      >
        I
      </button>
    </div>
  );
}
