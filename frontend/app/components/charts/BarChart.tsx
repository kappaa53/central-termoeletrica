'use client';

import { useEffect, useRef, useState } from 'react';

export type Bar = {
  key: string;
  label: string; // etiqueta do eixo X
  value: number;
  tooltip: string[]; // linhas do tooltip
  partial?: boolean; // ex.: dia em curso
};

type BarChartProps = {
  bars: Bar[];
  unit: string;
  height?: number;
  ariaLabel: string;
};

const MARGIN = { top: 16, right: 8, bottom: 28, left: 52 };
const BAR_COLOR = '#2563eb'; // blue-600
const PARTIAL_COLOR = '#93c5fd'; // blue-300
const HOVER_COLOR = '#1e40af'; // blue-800
const GRID_COLOR = '#e2e8f0';
const AXIS_TEXT = '#64748b';

function niceStep(max: number): number {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}

// Colunas verticais (uma série) com tooltip ao passar o rato
export default function BarChart({ bars, unit, height = 260, ariaLabel }: BarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const innerW = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const max = Math.max(...bars.map((b) => b.value), 0);
  const step = niceStep(max);
  const yMax = Math.max(step * Math.ceil(max / step), step);
  const slot = bars.length ? innerW / bars.length : 0;
  const gap = Math.min(4, slot * 0.25);
  const barW = Math.max(slot - gap, 1);
  const y = (v: number) => MARGIN.top + innerH - (v / yMax) * innerH;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);
  const labelEvery = Math.max(1, Math.ceil(bars.length / Math.max(1, Math.floor(innerW / 56))));

  const hovered = hover !== null ? bars[hover] : null;

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && bars.length > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} />
              <text x={MARGIN.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={AXIS_TEXT}>
                {t.toLocaleString('pt-PT')}
              </text>
            </g>
          ))}
          <text x={MARGIN.left - 8} y={8} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
            {unit}
          </text>

          {bars.map((b, i) => {
            const x = MARGIN.left + i * slot + gap / 2;
            const top = y(b.value);
            const h = MARGIN.top + innerH - top;
            const r = Math.min(4, barW / 2, h);
            // Topo arredondado, base reta (assente no eixo)
            const path =
              h <= 0
                ? ''
                : `M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`;
            return (
              <g key={b.key}>
                <path
                  d={path}
                  fill={hover === i ? HOVER_COLOR : b.partial ? PARTIAL_COLOR : BAR_COLOR}
                />
                {i % labelEvery === 0 && (
                  <text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
                    {b.label}
                  </text>
                )}
                {/* Área de hover maior que a barra */}
                <rect
                  x={MARGIN.left + i * slot}
                  y={MARGIN.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 w-44 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(MARGIN.left + hover * slot + slot / 2 - 88, 0), Math.max(width - 176, 0)),
            top: Math.max(y(hovered.value) - 70, 0),
          }}
        >
          {hovered.tooltip.map((line, i) => (
            <div key={i} className={i === 1 ? 'mt-0.5 font-semibold text-slate-900' : 'text-slate-500'}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
