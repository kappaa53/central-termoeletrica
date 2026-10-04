'use client';

export type HBarItem = {
  key: string;
  label: string;
  value: number;
  display: string; // valor formatado (etiqueta direta)
  sublabel?: string;
};

type HBarListProps = {
  items: HBarItem[];
  max?: number; // por omissão, o maior valor
  color?: string;
  emptyMessage?: string;
};

// Barras horizontais com etiqueta direta (uma série, comparação entre categorias)
export default function HBarList({
  items,
  max,
  color = '#2563eb',
  emptyMessage = 'Sem dados no período.',
}: HBarListProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{emptyMessage}</p>;
  }
  const top = max ?? Math.max(...items.map((i) => i.value), 0);

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,10rem)_1fr_auto]">
          <div className="min-w-0">
            <div className="truncate text-slate-700" title={item.label}>
              {item.label}
            </div>
            {item.sublabel && <div className="truncate text-xs text-slate-400">{item.sublabel}</div>}
          </div>
          <div className="h-3 rounded-r bg-slate-100" title={`${item.label}: ${item.display}`}>
            <div
              className="h-full rounded-r"
              style={{ width: `${top > 0 ? Math.max((item.value / top) * 100, item.value > 0 ? 1 : 0) : 0}%`, background: color }}
            />
          </div>
          <div className="w-20 text-right font-medium tabular-nums text-slate-900">{item.display}</div>
        </li>
      ))}
    </ul>
  );
}
