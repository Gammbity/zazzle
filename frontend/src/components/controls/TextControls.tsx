import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TextLayer } from '@/types/layer';
import { FONT_FAMILIES } from '@/types/layer';

const TEXT_COLOR_PRESETS = [
  '#111827',
  '#ffffff',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#16a34a',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#94a3b8',
  '#f97316',
] as const;

interface TextControlsProps {
  layer: TextLayer;
  onUpdate: (attrs: Partial<TextLayer>) => void;
}

export default function TextControls({ layer, onUpdate }: TextControlsProps) {
  const isBold = layer.fontStyle?.includes('bold');
  const isItalic = layer.fontStyle?.includes('italic');

  const toggleBold = () => {
    const next = isBold
      ? (layer.fontStyle?.replace('bold', '').trim() as TextLayer['fontStyle'])
      : (`bold ${layer.fontStyle ?? ''}`.trim() as TextLayer['fontStyle']);
    onUpdate({ fontStyle: next });
  };

  const toggleItalic = () => {
    const next = isItalic
      ? (layer.fontStyle?.replace('italic', '').trim() as TextLayer['fontStyle'])
      : (`${layer.fontStyle ?? ''} italic`.trim() as TextLayer['fontStyle']);
    onUpdate({ fontStyle: next });
  };

  const btnClass = (active?: boolean) =>
    cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-colors',
      active
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : 'border-stone-200 bg-white text-slate-600 hover:bg-amber-50 hover:border-amber-200'
    );

  return (
    <div className='rounded-[1.5rem] border border-amber-100 bg-amber-50/40 p-3'>
      <p className='mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700'>
        Matn sozlamalari
      </p>
      <div className='flex flex-wrap items-center gap-2'>
        {/* Text content */}
        <input
          type='text'
          value={layer.text}
          onChange={e => onUpdate({ text: e.target.value })}
          className='h-9 w-36 rounded-xl border border-stone-200 bg-white px-3 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 placeholder:text-slate-400'
          placeholder='Matn kiriting'
          aria-label='Matn mazmuni'
        />

        {/* Font family */}
        <select
          value={layer.fontFamily}
          onChange={e => onUpdate({ fontFamily: e.target.value })}
          className='h-9 rounded-xl border border-stone-200 bg-white px-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none'
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
          className='h-9 w-16 rounded-xl border border-stone-200 bg-white px-2 text-center text-sm focus:border-amber-400 focus:outline-none'
          aria-label="Shrift o'lchami"
        />

        <div className='h-6 w-px bg-stone-200' />

        {/* Bold */}
        <button
          type='button'
          onClick={toggleBold}
          className={cn(btnClass(isBold), 'font-black')}
          aria-label='Qalin'
          title='Qalin (Bold)'
        >
          B
        </button>

        {/* Italic */}
        <button
          type='button'
          onClick={toggleItalic}
          className={cn(btnClass(isItalic), 'italic')}
          aria-label='Kursiv'
          title='Kursiv (Italic)'
        >
          I
        </button>

        <div className='h-6 w-px bg-stone-200' />

        {/* Alignment */}
        <button
          type='button'
          onClick={() => onUpdate({ align: 'left' })}
          className={btnClass(layer.align === 'left')}
          aria-label='Chapga'
          title='Chapga tekislash'
        >
          <AlignLeft className='h-3.5 w-3.5' />
        </button>
        <button
          type='button'
          onClick={() => onUpdate({ align: 'center' })}
          className={btnClass(layer.align === 'center')}
          aria-label='Markazga'
          title='Markazga tekislash'
        >
          <AlignCenter className='h-3.5 w-3.5' />
        </button>
        <button
          type='button'
          onClick={() => onUpdate({ align: 'right' })}
          className={btnClass(layer.align === 'right')}
          aria-label="O'ngga"
          title="O'ngga tekislash"
        >
          <AlignRight className='h-3.5 w-3.5' />
        </button>

        <div className='h-6 w-px bg-stone-200' />

        {/* Color picker */}
        <input
          type='color'
          value={layer.fill}
          onChange={e => onUpdate({ fill: e.target.value })}
          className='h-9 w-9 cursor-pointer rounded-xl border border-stone-200 bg-white p-1'
          aria-label='Matn rangi'
          title='Rang tanlash'
        />

        {/* Color presets */}
        <div className='flex flex-wrap gap-1.5'>
          {TEXT_COLOR_PRESETS.map(color => (
            <button
              key={color}
              type='button'
              onClick={() => onUpdate({ fill: color })}
              className={cn(
                'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                layer.fill.toLowerCase() === color.toLowerCase()
                  ? 'border-amber-600 scale-110'
                  : 'border-white shadow-sm shadow-stone-200'
              )}
              style={{ backgroundColor: color }}
              aria-label={`Rang: ${color}`}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
