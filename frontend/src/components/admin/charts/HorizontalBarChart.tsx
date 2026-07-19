import { useState } from 'react';

interface BarDatum {
  label: string;
  value: number;
  valueLabel?: string;
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
}

export default function HorizontalBarChart({
  data,
  formatValue = value => value.toLocaleString('uz-UZ'),
  emptyMessage = "Ma'lumot yo'q",
}: HorizontalBarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(item => item.value), 1);

  if (data.length === 0) {
    return (
      <div className='flex h-32 items-center justify-center text-sm text-slate-400'>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {data.map((item, index) => {
        const widthPct =
          item.value > 0 ? Math.max((item.value / maxValue) * 100, 3) : 0;
        const isHovered = hoverIndex === index;
        return (
          <div
            key={item.label}
            onPointerEnter={() => setHoverIndex(index)}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <div className='mb-1 flex items-center justify-between gap-3 text-xs'>
              <span className='truncate text-slate-600'>{item.label}</span>
              <span
                className={`shrink-0 font-semibold tabular-nums transition-colors ${
                  isHovered ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {item.valueLabel ?? formatValue(item.value)}
              </span>
            </div>
            <div className='h-2 w-full overflow-hidden rounded bg-stone-100'>
              <div
                className={`h-full rounded-r transition-colors ${
                  isHovered ? 'bg-amber-700' : 'bg-amber-600'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
