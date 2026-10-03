'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import IncidentFormDialog from '@/app/components/IncidentFormDialog';
import Pagination from '@/app/components/Pagination';
import { filterClass } from '@/app/components/ui/Modal';
import { useGroups } from '@/app/hooks/useGroups';
import { useIncidents } from '@/app/hooks/useOperations';
import {
  incidentSeverities,
  incidentStatuses,
  incidentTypes,
  Pill,
} from '@/app/lib/constants/operations';
import { formatDateTime } from '@/app/lib/format';
import type { IncidentFilters, IncidentSeverity, IncidentType } from '@/app/services/api';

type StatusFilter = NonNullable<IncidentFilters['status']> | 'ALL';

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: 'OPEN', label: 'Em aberto' },
  { value: 'ABERTA', label: 'Abertas' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'EM_EXECUCAO', label: 'Em execução' },
  { value: 'RESOLVIDA', label: 'Resolvidas' },
  { value: 'FECHADA', label: 'Fechadas' },
  { value: 'ALL', label: 'Todas' },
];

export default function IncidentList({ fixedGroupCode }: { fixedGroupCode?: string }) {
  const { groups } = useGroups();
  const [status, setStatus] = useState<StatusFilter>('OPEN');
  const [severity, setSeverity] = useState<IncidentSeverity | ''>('');
  const [type, setType] = useState<IncidentType | ''>('');
  const [groupCode, setGroupCode] = useState('');
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);

  const { items, total, pageCount, loading, error } = useIncidents(
    {
      groupCode: fixedGroupCode ?? (groupCode || undefined),
      status: status === 'ALL' ? undefined : status,
      severity: severity || undefined,
      type: type || undefined,
    },
    page,
  );

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  return (
    <>
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => resetPage(setStatus)(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  status === tab.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <PlusIcon className="h-4 w-4" />
            Nova ocorrência
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Severidade"
            value={severity}
            onChange={(e) => resetPage(setSeverity)(e.target.value as IncidentSeverity | '')}
            className={filterClass}
          >
            <option value="">Todas as severidades</option>
            {Object.entries(incidentSeverities).map(([v, s]) => (
              <option key={v} value={v}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Tipo"
            value={type}
            onChange={(e) => resetPage(setType)(e.target.value as IncidentType | '')}
            className={filterClass}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(incidentTypes).map(([v, s]) => (
              <option key={v} value={v}>
                {s.label}
              </option>
            ))}
          </select>
          {!fixedGroupCode && (
            <select
              aria-label="Grupo"
              value={groupCode}
              onChange={(e) => resetPage(setGroupCode)(e.target.value)}
              className={filterClass}
            >
              <option value="">Todos os grupos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.code}>
                  {g.code}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {error ? (
          <p className="py-16 text-center text-red-500">{error}</p>
        ) : loading ? (
          <p className="py-16 text-center text-slate-500">A carregar ocorrências...</p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircleIcon className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
            <p className="text-slate-600">Nenhuma ocorrência encontrada com estes filtros.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((inc) => (
              <li key={inc.id}>
                <Link
                  href={`/incidents/${inc.id}`}
                  className="flex flex-col gap-2 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400">#{inc.id}</span>
                      {!fixedGroupCode && <span className="text-sm font-semibold text-slate-900">{inc.group_code}</span>}
                      <Pill style={incidentSeverities[inc.severity]} />
                      <Pill style={incidentTypes[inc.type]} />
                      {inc.alert_id && <span className="text-xs text-slate-500">· alerta #{inc.alert_id}</span>}
                    </div>
                    <p className="mt-1 truncate font-medium text-slate-900">{inc.title}</p>
                    <p className="text-xs text-slate-500">
                      Aberta por {inc.operator} em {formatDateTime(inc.opened_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                    <Pill style={incidentStatuses[inc.status]} />
                    <span className="text-xs text-slate-400">Atualizada {formatDateTime(inc.updated_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {total > 0 && (
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            shown={items.length}
            onChange={setPage}
            itemLabel="ocorrências"
          />
        )}
      </section>

      {creating && <IncidentFormDialog onClose={() => setCreating(false)} fixedGroupCode={fixedGroupCode} />}
    </>
  );
}
