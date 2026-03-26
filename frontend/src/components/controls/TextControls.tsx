import { cn } from '@/lib/utils';
import type { TextLayer } from '@/types/layer';
import { FONT_FAMILIES } from '@/types/layer';

const TEXT_COLOR_PRESETS = [
  '#111827',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0f766e',
  '#0891b2',
  '#ffffff',
  '#94a3b8',
] as const;

interface TextControlsProps {
  layer: TextLayer;
  onUpdate: (attrs: Partial<TextLayer>) => void;
}

/**
 * Inline toolbar for editing a selected text layer.
 * Pure presentation - receives the layer and an update callback.
 */
export default function TextControls({ layer, onUpdate }: TextControlsProps) {
  return (
    <div className='flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3'>
      {/* Text content */}
      <input
        type='text'
        value={layer.text}
        onChange={e => onUpdate({ text: e.target.value })}
        className='w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400'
        placeholder='Matn kiriting'
        aria-label='Matn mazmuni'
      />

      {/* Font family */}
      <select
        value={layer.fontFamily}
        onChange={e => onUpdate({ fontFamily: e.target.value })}
        className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none'
        aria-label='Shrift'
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
        className='w-16 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none'
        aria-label="Shrift o'lchami"
      />

      {/* Color */}
      <input
        type='color'
        value={layer.fill}
        onChange={e => onUpdate({ fill: e.target.value })}
        className='h-10 w-10 cursor-pointer rounded-xl border border-slate-200 bg-white p-1'
        aria-label='Matn rangi'
      />

      <div className='flex flex-wrap items-center gap-2'>
        {TEXT_COLOR_PRESETS.map(color => (
          <button
            key={color}
            type='button'
            onClick={() => onUpdate({ fill: color })}
            className={cn(
              'h-7 w-7 rounded-full border-2 transition-transform hover:scale-105',
              layer.fill.toLowerCase() === color.toLowerCase()
                ? 'border-slate-900'
                : 'border-white shadow-sm shadow-slate-200'
            )}
            style={{ backgroundColor: color }}
            aria-label={`Matn rangini ${color} ga o'zgartirish`}
            title={color}
          />
        ))}
      </div>

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
          'rounded-xl border px-3 py-2 text-sm font-bold transition-colors',
          layer.fontStyle?.includes('bold')
            ? 'border-sky-400 bg-sky-50 text-sky-700'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
        )}
        aria-label='Qalin qilish'
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
          'rounded-xl border px-3 py-2 text-sm italic transition-colors',
          layer.fontStyle?.includes('italic')
            ? 'border-sky-400 bg-sky-50 text-sky-700'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
        )}
        aria-label='Kursiv qilish'
      >
        I
      </button>
    </div>
  );
}
