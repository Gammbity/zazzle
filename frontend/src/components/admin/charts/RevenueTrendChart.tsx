import { useMemo, useState, type PointerEvent } from 'react';
import { formatMoney } from '@/lib/commerce';

interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueTrendChartProps {
  data: RevenuePoint[];
}

const WIDTH = 600;
const HEIGHT = 220;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 12;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;
const PLOT_WIDTH = WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}K`;
  return `${Math.round(value)}`;
}

function formatDateShort(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
}

export default function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxRevenue = useMemo(
    () => niceMax(Math.max(...data.map(point => point.revenue), 0)),
    [data]
  );

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const stepX = data.length > 1 ? PLOT_WIDTH / (data.length - 1) : 0;
    return data.map((point, index) => ({
      ...point,
      x: PADDING_LEFT + stepX * index,
      y:
        PADDING_TOP +
        PLOT_HEIGHT -
        (maxRevenue > 0 ? (point.revenue / maxRevenue) * PLOT_HEIGHT : 0),
    }));
  }, [data, maxRevenue]);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const baselineY = PADDING_TOP + PLOT_HEIGHT;
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${points[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`
      : '';

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let closestIndex = 0;
    let closestDistance = Infinity;
    points.forEach((point, index) => {
      const distance = Math.abs(point.x - relativeX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setHoverIndex(closestIndex);
  };

  const last = points[points.length - 1] ?? null;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const xLabelIndexes = Array.from(
    new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])
  );

  if (data.length === 0) {
    return (
      <div className='flex h-48 items-center justify-center text-sm text-slate-400'>
        Ma&apos;lumot yo&apos;q
      </div>
    );
  }

  return (
    <div className='relative'>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className='w-full text-amber-600'
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        role='img'
        aria-label={`Kunlik tushum trendi, oxirgi qiymat ${last ? formatMoney(last.revenue) : ''}`}
      >
        {GRID_FRACTIONS.map(fraction => {
          const y = PADDING_TOP + PLOT_HEIGHT * (1 - fraction);
          const value = maxRevenue * fraction;
          return (
            <g key={fraction}>
              <line
                x1={PADDING_LEFT}
                x2={WIDTH - PADDING_RIGHT}
                y1={y}
                y2={y}
                stroke='#e7e5e4'
                strokeWidth={1}
              />
              <text
                x={PADDING_LEFT - 8}
                y={y + 3}
                textAnchor='end'
                className='fill-slate-400'
                fontSize={9}
              >
                {formatCompact(value)}
              </text>
            </g>
          );
        })}

        {areaPath && (
          <path d={areaPath} fill='currentColor' fillOpacity={0.12} stroke='none' />
        )}

        <path
          d={linePath}
          fill='none'
          stroke='currentColor'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
        />

        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PADDING_TOP}
            y2={baselineY}
            stroke='#a8a29e'
            strokeWidth={1}
          />
        )}

        {last && (
          <circle
            cx={last.x}
            cy={last.y}
            r={4}
            fill='currentColor'
            stroke='white'
            strokeWidth={2}
          />
        )}
        {hovered && hoverIndex !== points.length - 1 && (
          <circle
            cx={hovered.x}
            cy={hovered.y}
            r={4}
            fill='currentColor'
            stroke='white'
            strokeWidth={2}
          />
        )}

        {last && (
          <text
            x={last.x}
            y={Math.max(last.y - 10, PADDING_TOP + 8)}
            textAnchor='end'
            className='fill-slate-700'
            fontSize={11}
            fontWeight={600}
          >
            {formatMoney(last.revenue)}
          </text>
        )}

        {xLabelIndexes.map(index => {
          const point = points[index];
          if (!point) return null;
          return (
            <text
              key={index}
              x={point.x}
              y={HEIGHT - 8}
              textAnchor={
                index === 0
                  ? 'start'
                  : index === points.length - 1
                    ? 'end'
                    : 'middle'
              }
              className='fill-slate-400'
              fontSize={9}
            >
              {formatDateShort(point.date)}
            </text>
          );
        })}
      </svg>

      {hovered && (
        <div
          className='pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg'
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100}%`,
          }}
        >
          <p className='font-semibold text-slate-900'>
            {formatMoney(hovered.revenue)}
          </p>
          <p className='text-slate-500'>
            {formatDateShort(hovered.date)} &middot; {hovered.orders} ta
            buyurtma
          </p>
        </div>
      )}
    </div>
  );
}
