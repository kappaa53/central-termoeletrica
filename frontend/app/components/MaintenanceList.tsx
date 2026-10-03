'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, PlusIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import MaintenanceFormDialog from '@/app/components/MaintenanceFormDialog';
import Pagination from '@/app/components/Pagination';
import Modal, { Field, FormActions, fieldClass, filterClass } from '@/app/components/ui/Modal';
import { useGroups } from '@/app/hooks/useGroups';
import { MANAGEMENT_ROLES, useAuth } from '@/app/lib/auth';
import { useMaintenance } from '@/app/hooks/useOperations';
import {
  formatCurrency,
  maintenancePriorities,
  maintenanceStatuses,
  maintenanceTypes,
  Pill,
} from '@/app/lib/constants/operations';
import { formatDateTime, formatNumber } from '@/app/lib/format';
import {
  cancelMaintenance,
  completeMaintenance,
  startMaintenance,
  type Maintenance,
  type MaintenanceFilters,
  type MaintenanceType,
} from '@/app/services/api';

type StatusFilter = NonNullable<MaintenanceFilters['status']> | 'ALL' | 'OVERDUE';

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'OVERDUE', label: 'Em atraso' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'AGENDADA', label: 'Agendadas' },
  { value: 'CONCLUIDA', label: 'Concluídas' },
  { value: 'CANCELADA', label: 'Canceladas' },
  { value: 'ALL', label: 'Todas' },
];

type MaintenanceListProps = {
  fixedGroupCode?: string;
  onChanged?: () => void;
};

export default function MaintenanceList({ fixedGroupCode, onChanged }: MaintenanceListProps) {
  const { groups } = useGroups();
  const { hasRole } = useAuth();
  const canManage = hasRole(...MANAGEMENT_ROLES);
  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [type, setType] = useState<MaintenanceType | ''>('');
  const [groupCode, setGroupCode] = useState('');
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState<Maintenance | null>(null);
  const [cancelling, setCancelling] = useState<Maintenance | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { items, total, pageCount, loading, error, reload } = useMaintenance(
    {
      groupCode: fixedGroupCode ?? (groupCode || undefined),
      status: status === 'ALL' || status === 'OVERDUE' ? undefined : status,
      overdue: status === 'OVERDUE' ? true : undefined,
      type: type || undefined,
    },
    page,
  );

  const refresh = () => {
    reload();
    onChanged?.();
  };

  const handleStart = async (order: Maintenance) => {
    try {
      setActionError(null);
      await startMaintenance(order.id);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao iniciar');
    }
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
                onClick={() => {
                  setStatus(tab.value);
                  setPage(0);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  status === tab.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <PlusIcon className="h-4 w-4" />
              Agendar manutenção
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Tipo"
            value={type}
            onChange={(e) => {
              setType(e.target.value as MaintenanceType | '');
              setPage(0);
            }}
            className={filterClass}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(maintenanceTypes).map(([v, s]) => (
              <option key={v} value={v}>
                {s.label}
              </option>
            ))}
          </select>
          {!fixedGroupCode && (
            <select
              aria-label="Grupo"
              value={groupCode}
              onChange={(e) => {
                setGroupCode(e.target.value);
                setPage(0);
              }}
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

      {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

      <section className="mt-4 space-y-3">
        {error ? (
          <p className="py-16 text-center text-red-500">{error}</p>
        ) : loading ? (
          <p className="py-16 text-center text-slate-500">A carregar manutenção...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <WrenchScrewdriverIcon className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-600">Nenhuma ordem de manutenção encontrada.</p>
          </div>
        ) : (
          items.map((m) => (
            <MaintenanceCard
              key={m.id}
              order={m}
              showGroup={!fixedGroupCode}
              onStart={() => handleStart(m)}
              onComplete={() => setCompleting(m)}
              onCancel={canManage ? () => setCancelling(m) : undefined}
            />
          ))
        )}
      </section>

      {total > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            shown={items.length}
            onChange={setPage}
            itemLabel="ordens"
          />
        </div>
      )}

      {creating && (
        <MaintenanceFormDialog onClose={() => setCreating(false)} onCreated={refresh} fixedGroupCode={fixedGroupCode} />
      )}
      {completing && (
        <CompleteDialog order={completing} onClose={() => setCompleting(null)} onDone={refresh} />
      )}
      {cancelling && <CancelDialog order={cancelling} onClose={() => setCancelling(null)} onDone={refresh} />}
    </>
  );
}

function MaintenanceCard({
  order: m,
  showGroup,
  onStart,
  onComplete,
  onCancel,
}: {
  order: Maintenance;
  showGroup: boolean;
  onStart: () => void;
  onComplete: () => void;
  // Ausente para quem não pode cancelar (operadores)
  onCancel?: () => void;
}) {
  const pending = m.status === 'AGENDADA' || m.status === 'EM_ANDAMENTO';

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        m.overdue ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">#{m.id}</span>
            {showGroup && <span className="text-sm font-semibold text-slate-900">{m.group_code}</span>}
            <Pill style={maintenanceTypes[m.type]} />
            <Pill style={maintenanceStatuses[m.status]} />
            {m.overdue && (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                Em atraso
              </span>
            )}
          </div>
          <p className="mt-1 font-medium text-slate-900">{m.title}</p>
          {m.description && <p className="text-sm text-slate-600">{m.description}</p>}

          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 sm:grid-cols-4">
            <div>
              <dt>Agendada</dt>
              <dd className="font-medium text-slate-700">{formatDateTime(m.scheduled_date)}</dd>
            </div>
            <div>
              <dt>Técnico</dt>
              <dd className="font-medium text-slate-700">{m.technician}</dd>
            </div>
            <div>
              <dt>Prioridade</dt>
              <dd className={`font-medium ${maintenancePriorities[m.priority].className}`}>
                {maintenancePriorities[m.priority].label}
              </dd>
            </div>
            <div>
              <dt>{m.actual_cost !== null ? 'Custo real' : 'Custo estimado'}</dt>
              <dd className="font-medium text-slate-700">
                {formatCurrency(m.actual_cost ?? m.estimated_cost)}
                {m.work_hours !== null && ` · ${formatNumber(m.work_hours, 'h', 0)}`}
              </dd>
            </div>
          </dl>

          {m.completed_date && (
            <p className="mt-1 text-xs text-slate-500">Concluída em {formatDateTime(m.completed_date)}</p>
          )}
          {m.notes && <p className="mt-1 whitespace-pre-line text-xs text-slate-500">{m.notes}</p>}
          {m.incident_id && (
            <Link href={`/incidents/${m.incident_id}`} className="mt-1 inline-block text-xs text-sky-700 hover:underline">
              Ocorrência #{m.incident_id} →
            </Link>
          )}
        </div>

        {pending && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {m.status === 'AGENDADA' && (
              <button
                type="button"
                onClick={onStart}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Iniciar
              </button>
            )}
            <button
              type="button"
              onClick={onComplete}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              Concluir
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompleteDialog({ order, onClose, onDone }: { order: Maintenance; onClose: () => void; onDone: () => void }) {
  const [cost, setCost] = useState(order.estimated_cost !== null ? String(order.estimated_cost) : '');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await completeMaintenance(order.id, {
        actual_cost: cost ? Number(cost) : null,
        work_hours: hours ? Number(hours) : null,
        notes: notes.trim() || null,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao concluir');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Concluir: ${order.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Custo real (MT)">
            <input type="number" min="0" step="1" value={cost} onChange={(e) => setCost(e.target.value)} className={fieldClass} />
          </Field>
          <Field label="Horas de trabalho">
            <input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} className={fieldClass} />
          </Field>
        </div>
        <Field label="Notas">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={fieldClass} />
        </Field>
        <p className="text-xs text-slate-500">
          Se o grupo estiver em manutenção e não houver outras ordens em curso, passa a &quot;Parado&quot; (disponível).
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Concluir" />
      </form>
    </Modal>
  );
}

function CancelDialog({ order, onClose, onDone }: { order: Maintenance; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await cancelMaintenance(order.id, reason.trim());
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Cancelar: ${order.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="Motivo do cancelamento">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={fieldClass} required />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Cancelar ordem" />
      </form>
    </Modal>
  );
}
