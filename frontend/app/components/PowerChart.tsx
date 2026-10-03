'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDateTime, formatNumber } from '@/app/lib/format';
import type { OperationalReading } from '@/app/services/api';

type PowerChartProps = {
  readings: OperationalReading[];
  nominalPowerMw: number;
  height?: number;
};

const MARGIN = { top: 28, right: 16, bottom: 28, left: 48 };
const LINE_COLOR = '#2563eb'; // blue-600
const GRID_COLOR = '#e2e8f0'; // slate-200
const AXIS_TEXT = '#64748b'; // slate-500

export default function PowerChart({ readings, nominalPowerMw, height = 240 }: PowerChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Ordem cronológica e apenas leituras com potência registada
  const points = useMemo(
    () =>
      [...readings]
        .filter((r) => r.power !== null)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .map((r) => ({ t: new Date(r.timestamp).getTime(), power: r.power as number, reading: r })),
    [readings],
  );

  const hasData = points.length >= 2;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasData]);


  if (!hasData) {
    return (
      <div ref={containerRef} className="flex h-40 items-center justify-center text-sm text-slate-400">
        Leituras insuficientes para o gráfico.
      </div>
    );
  }

  const innerW = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const tMin = points[0].t;
  const tMax = points[points.length - 1].t;
  const yMax = niceMax(Math.max(nominalPowerMw * 1.1, ...points.map((p) => p.power)));

  const x = (t: number) => MARGIN.left + ((t - tMin) / (tMax - tMin || 1)) * innerW;
  const y = (v: number) => MARGIN.top + innerH - (v / yMax) * innerH;

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t)},${y(p.power)}`).join(' ');
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  // Casas decimais suficientes para o passo da escala (ex.: 0,75 / 2,25)
  const yStep = yMax / 4;
  const tickDigits = Number.isInteger(yStep) ? 0 : Number.isInteger(Math.round(yStep * 1000) / 100) ? 1 : 2;
  const xTickCount = Math.min(5, points.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) =>
    points[Math.round((i * (points.length - 1)) / (xTickCount - 1))],
  );

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left + MARGIN.left;
    let nearest = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(x(points[i].t) - px) < Math.abs(x(points[nearest].t) - px)) nearest = i;
    }
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Potência ativa das últimas ${points.length} leituras`}
        >
          {/* Grelha e eixo Y */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(v)} y2={y(v)} stroke={GRID_COLOR} strokeWidth={1} />
              <text x={MARGIN.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={AXIS_TEXT}>
                {formatNumber(v, '', tickDigits)}
              </text>
            </g>
          ))}
          <text x={MARGIN.left - 8} y={12} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
            MW
          </text>

          {/* Eixo X */}
          {xTicks.map((p, i) => (
            <text
              key={p.t}
              x={x(p.t)}
              y={height - 8}
              textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
              fontSize={11}
              fill={AXIS_TEXT}
            >
              {new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(p.t)}
            </text>
          ))}

          {/* Referência: potência nominal */}
          <line
            x1={MARGIN.left}
            x2={width - MARGIN.right}
            y1={y(nominalPowerMw)}
            y2={y(nominalPowerMw)}
            stroke={AXIS_TEXT}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text x={width - MARGIN.right} y={y(nominalPowerMw) - 6} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>
            Nominal {formatNumber(nominalPowerMw, 'MW', 3)}
          </text>

          {/* Série */}
          <path d={path} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Camada de interação */}
          {hovered && (
            <g pointerEvents="none">
              <line x1={x(hovered.t)} x2={x(hovered.t)} y1={MARGIN.top} y2={MARGIN.top + innerH} stroke={AXIS_TEXT} strokeWidth={1} />
              <circle cx={x(hovered.t)} cy={y(hovered.power)} r={5} fill={LINE_COLOR} stroke="#fff" strokeWidth={2} />
            </g>
          )}
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
          />
        </svg>
      )}

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(x(hovered.t) - 80, 0), Math.max(width - 160, 0)),
            top: Math.max(y(hovered.power) - 64, 0),
            width: 160,
          }}
        >
          <div className="text-slate-500">{formatDateTime(hovered.reading.timestamp)}</div>
          <div className="mt-1 font-semibold text-slate-900">{formatNumber(hovered.power, 'MW', 3)}</div>
          <div className="text-slate-500">
            {formatNumber((hovered.power / nominalPowerMw) * 100, '%', 0)} da nominal
          </div>
        </div>
      )}
    </div>
  );
}

// Máximo do eixo = 4 passos "redondos" (ex.: 0,3 → 1,2 MW; 0,75 → 3 MW)
const NICE_STEPS = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 1, 1.5, 2, 2.5, 5, 10];

function niceMax(value: number): number {
  const step = NICE_STEPS.find((s) => s * 4 >= value) ?? Math.ceil(value / 4);
  return step * 4;
}
