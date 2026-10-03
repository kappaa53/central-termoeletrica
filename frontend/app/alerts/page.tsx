// frontend/app/alerts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import AlertCard from '@/app/components/AlertCard';
import Pagination from '@/app/components/Pagination';
import { useAlerts } from '@/app/hooks/useAlerts';
import { useGroups } from '@/app/hooks/useGroups';
import {
  getAlertSummary,
  type AlertFilters,
  type AlertSeverity,
  type AlertSummary,
} from '@/app/services/api';

type StatusFilter = NonNullable<AlertFilters['status']> | 'ALL';

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: 'OPEN', label: 'Abertos' },
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'ACKNOWLEDGED', label: 'Reconhecidos' },
  { value: 'RESOLVED', label: 'Resolvidos' },
  { value: 'ALL', label: 'Todos' },
];

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

export default function AlertsPage() {
  const { groups } = useGroups();
  const [status, setStatus] = useState<StatusFilter>('OPEN');
  const [severity, setSeverity] = useState<AlertSeverity | ''>('');
  const [groupCode, setGroupCode] = useState('');
  const [page, setPage] = useState(0);

  const { alerts, total, pageCount, loading, error, reload } = useAlerts(
    {
      status: status === 'ALL' ? undefined : status,
      severity: severity || undefined,
      groupCode: groupCode || undefined,
    },
    page,
  );

  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [summaryVersion, setSummaryVersion] = useState(0);

  useEffect(() => {
    getAlertSummary().then(setSummary).catch(console.error);
  }, [summaryVersion]);

  const handleChanged = () => {
    reload();
    setSummaryVersion((v) => v + 1);
  };

  return (
    <div className="p-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Alertas abertos" value={summary?.open} tone={summary?.open ? 'danger' : 'ok'} />
        <SummaryCard label="Críticos abertos" value={summary?.critical_open} tone={summary?.critical_open ? 'danger' : 'ok'} />
        <SummaryCard label="Por reconhecer" value={summary?.active} />
        <SummaryCard
          label="Grupos afetados"
          value={summary?.groups_with_open_alerts.length}
          description={summary?.groups_with_open_alerts.join(', ') || 'Nenhum'}
        />
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(0);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                status === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Severidade"
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value as AlertSeverity | '');
              setPage(0);
            }}
            className={selectClass}
          >
            <option value="">Todas as severidades</option>
            <option value="CRITICAL">Crítico</option>
            <option value="WARNING">Aviso</option>
          </select>

          <select
            aria-label="Grupo gerador"
            value={groupCode}
            onChange={(e) => {
              setGroupCode(e.target.value);
              setPage(0);
            }}
            className={selectClass}
          >
            <option value="">Todos os grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.code}>
                {g.code}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {error ? (
          <p className="py-16 text-center text-red-500">{error}</p>
        ) : loading ? (
          <p className="py-16 text-center text-slate-500">A carregar alertas...</p>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <CheckCircleIcon className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
            <p className="text-slate-600">Nenhum alerta encontrado com estes filtros.</p>
          </div>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onChanged={handleChanged} />)
        )}
      </section>

      {total > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            shown={alerts.length}
            onChange={setPage}
            itemLabel="alertas"
          />
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: number | undefined;
  description?: string;
  tone?: 'danger' | 'ok';
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          tone === 'danger' ? 'text-red-600' : tone === 'ok' ? 'text-emerald-600' : 'text-slate-900'
        }`}
      >
        {value ?? '—'}
      </p>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
    </div>
  );
}
