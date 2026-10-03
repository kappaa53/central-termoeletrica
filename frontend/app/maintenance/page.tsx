// frontend/app/maintenance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import MaintenanceList from '@/app/components/MaintenanceList';
import { formatCurrency } from '@/app/lib/constants/operations';
import { getMaintenanceSummary, type MaintenanceSummary } from '@/app/services/api';

export default function MaintenancePage() {
  const [summary, setSummary] = useState<MaintenanceSummary | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    getMaintenanceSummary().then(setSummary).catch(console.error);
  }, [version]);

  return (
    <div className="p-6">
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pendentes"
          value={summary ? String(summary.scheduled + summary.in_progress) : undefined}
          description={summary ? `${summary.in_progress} em andamento · ${summary.scheduled} agendadas` : undefined}
        />
        <StatCard
          label="Em atraso"
          value={summary ? String(summary.overdue) : undefined}
          danger={Boolean(summary?.overdue)}
          description="Agendadas com data ultrapassada"
        />
        <StatCard
          label="Concluídas (30 dias)"
          value={summary ? String(summary.completed_last_30d) : undefined}
          description={summary ? `Custo real: ${formatCurrency(summary.cost_last_30d)}` : undefined}
        />
        <StatCard
          label="Custo estimado pendente"
          value={summary ? formatCurrency(summary.estimated_pending_cost) : undefined}
          description="Ordens agendadas e em andamento"
        />
      </section>

      <MaintenanceList onChanged={() => setVersion((v) => v + 1)} />
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
  value: string | undefined;
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
