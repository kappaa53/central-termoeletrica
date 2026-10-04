// frontend/app/statistics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BarChart from '@/app/components/charts/BarChart';
import HBarList from '@/app/components/charts/HBarList';
import { formatCurrency } from '@/app/lib/constants/operations';
import { formatDateTime, formatNumber } from '@/app/lib/format';
import { getStatistics, type StatisticsReport } from '@/app/services/api';

const PERIODS = [7, 30, 90];

const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' }).format(new Date(`${iso}T00:00:00`));

const dayLong = (iso: string) =>
  new Intl.DateTimeFormat('pt-PT', { weekday: 'short', day: '2-digit', month: 'long' }).format(new Date(`${iso}T00:00:00`));

function todayIso(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function StatisticsPage() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<StatisticsReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStatistics(days)
      .then((r) => {
        if (cancelled) return;
        setReport(r);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Erro'));
    return () => {
      cancelled = true;
    };
  }, [days]);

  const o = report?.overview;
  const today = todayIso();

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDays(p)}
              aria-pressed={days === p}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                days === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p} dias
            </button>
          ))}
        </div>
        {o && (
          <p className="text-sm text-slate-500">
            {formatDateTime(o.start)} – {formatDateTime(o.end)}
          </p>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!report || !o ? (
        !error && <p className="py-16 text-center text-slate-500">A calcular indicadores...</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Energia produzida"
              value={formatNumber(o.energy_mwh, 'MWh', 0)}
              detail={`Potência média ${formatNumber(o.avg_power_mw, 'MW', 2)}`}
            />
            <Kpi
              label="Disponibilidade"
              value={formatNumber(o.availability_pct, '%', 1)}
              detail={`Utilização ${formatNumber(o.utilization_pct, '%', 1)}`}
            />
            <Kpi label="Fator de carga" value={formatNumber(o.load_factor_pct, '%', 1)} detail="Grupos em operação" />
            <Kpi
              label="Custo de manutenção"
              value={formatCurrency(o.maintenance_cost)}
              detail={`${o.maintenance_completed} ordem(ns) concluída(s)`}
            />
            <Kpi
              label="Alertas"
              value={String(o.alerts_total)}
              detail={`${o.alerts_critical} crítico(s)`}
              danger={o.alerts_critical > 0}
            />
            <Kpi
              label="Ocorrências registadas"
              value={String(o.incidents_opened)}
              detail={`${o.incidents_resolved} resolvida(s) no período`}
            />
            <Kpi
              label="Tempo médio de resolução"
              value={o.mttr_hours === null ? '—' : formatNumber(o.mttr_hours, 'h', 1)}
              detail="MTTR das ocorrências"
            />
            <Kpi
              label="Energia por dia"
              value={formatNumber(o.energy_mwh / o.days, 'MWh', 0)}
              detail="Média diária"
            />
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-slate-900">Energia produzida por dia</h2>
              <span className="text-xs text-slate-500">
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-blue-300 align-middle" />
                dia incompleto (início/fim do período)
              </span>
            </div>
            <div className="mt-4">
              <BarChart
                ariaLabel="Energia produzida por dia, em MWh"
                unit="MWh"
                bars={report.daily_energy.map((d, i) => {
                  // O primeiro e o último dia do período estão incompletos
                  const partial = d.day === today || (i === 0 && !o.start.endsWith('T00:00:00'));
                  return {
                    key: d.day,
                    label: dayLabel(d.day),
                    value: d.energy_mwh,
                    partial,
                    tooltip: [dayLong(d.day) + (partial ? ' (parcial)' : ''), formatNumber(d.energy_mwh, 'MWh', 1)],
                  };
                })}
              />
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card title="Energia por grupo">
              <HBarList
                items={[...report.groups]
                  .sort((a, b) => b.energy_mwh - a.energy_mwh)
                  .map((g) => ({
                    key: g.code,
                    label: g.code,
                    sublabel: `${g.manufacturer} · ${formatNumber(g.nominal_power_mw, 'MW', 2)}`,
                    value: g.energy_mwh,
                    display: formatNumber(g.energy_mwh, 'MWh', 0),
                  }))}
              />
            </Card>
            <Card title="Utilização por grupo" subtitle="Percentagem das leituras em operação">
              <HBarList
                max={100}
                items={report.groups.map((g) => ({
                  key: g.code,
                  label: g.code,
                  sublabel: `Disponibilidade ${formatNumber(g.availability_pct, '%', 0)}`,
                  value: g.utilization_pct,
                  display: formatNumber(g.utilization_pct, '%', 1),
                }))}
              />
            </Card>
            <Card title="Alertas por parâmetro">
              <HBarList
                color="#64748b"
                emptyMessage="Sem alertas no período."
                items={report.alerts_by_parameter.map((a) => ({
                  key: a.key,
                  label: a.label,
                  value: a.count,
                  display: String(a.count),
                }))}
              />
            </Card>
            <Card title="Ocorrências por tipo">
              <HBarList
                color="#64748b"
                emptyMessage="Sem ocorrências no período."
                items={report.incidents_by_type.map((i) => ({
                  key: i.key,
                  label: i.label,
                  value: i.count,
                  display: String(i.count),
                }))}
              />
            </Card>
          </section>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Resumo por grupo</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {['Grupo', 'Energia', 'Horas func.', 'Disponib.', 'Utilização', 'Fator carga', 'Alertas', 'Ocorrências', 'Custo manut.'].map(
                      (h, i) => (
                        <th key={h} className={`whitespace-nowrap px-5 py-3 font-semibold ${i > 0 ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 tabular-nums">
                  {report.groups.map((g) => (
                    <tr key={g.code} className="hover:bg-slate-50/80">
                      <td className="px-5 py-3">
                        <Link href={`/groups/${g.code}`} className="font-semibold text-slate-900 hover:underline">
                          {g.code}
                        </Link>
                        <span className="ml-2 text-xs text-slate-400">{g.manufacturer}</span>
                      </td>
                      <td className="px-5 py-3 text-right">{formatNumber(g.energy_mwh, 'MWh', 0)}</td>
                      <td className="px-5 py-3 text-right">{formatNumber(g.operating_hours, 'h', 0)}</td>
                      <td className="px-5 py-3 text-right">{formatNumber(g.availability_pct, '%', 1)}</td>
                      <td className="px-5 py-3 text-right">{formatNumber(g.utilization_pct, '%', 1)}</td>
                      <td className="px-5 py-3 text-right">{formatNumber(g.load_factor_pct, '%', 1)}</td>
                      <td className="px-5 py-3 text-right">{g.alerts}</td>
                      <td className="px-5 py-3 text-right">{g.incidents}</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(g.maintenance_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, detail, danger = false }: { label: string; value: string; detail: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
