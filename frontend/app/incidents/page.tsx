// frontend/app/incidents/page.tsx
'use client';

import { useEffect, useState } from 'react';
import IncidentList from '@/app/components/IncidentList';
import { formatNumber } from '@/app/lib/format';
import { getIncidentSummary, type IncidentSummary } from '@/app/services/api';

export default function IncidentsPage() {
  const [summary, setSummary] = useState<IncidentSummary | null>(null);

  useEffect(() => {
    getIncidentSummary().then(setSummary).catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Em aberto" value={summary?.open} danger={Boolean(summary?.open)} />
        <StatCard label="Críticas em aberto" value={summary?.critical_open} danger={Boolean(summary?.critical_open)} />
        <StatCard label="Resolvidas (30 dias)" value={summary?.resolved_last_30d} />
        <StatCard
          label="Tempo médio de resolução"
          value={summary ? formatNumber(summary.avg_resolution_hours, 'h', 1) : undefined}
          description="Últimos 30 dias"
        />
      </section>

      <IncidentList />
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  danger = false,
}: {
  label: string;
  value: number | string | undefined;
  description?: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${danger ? 'text-red-600' : 'text-slate-900'}`}>{value ?? '—'}</p>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
  );
}
