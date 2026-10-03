// frontend/app/incidents/[id]/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import MaintenanceFormDialog from '@/app/components/MaintenanceFormDialog';
import Modal, { Field, FormActions, fieldClass } from '@/app/components/ui/Modal';
import {
  incidentSeverities,
  incidentStatuses,
  incidentTransitionLabels,
  incidentTypes,
  maintenanceStatuses,
  Pill,
} from '@/app/lib/constants/operations';
import { CURRENT_USER } from '@/app/lib/currentUser';
import { formatDateTime } from '@/app/lib/format';
import {
  addIncidentNote,
  changeIncidentStatus,
  editIncident,
  getIncident,
  INCIDENT_TRANSITIONS,
  type IncidentDetail,
  type IncidentStatus,
} from '@/app/services/api';

export default function IncidentDetailPage() {
  const id = Number(useParams().id);

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [transition, setTransition] = useState<IncidentStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const load = useCallback(() => {
    getIncident(id)
      .then((data) => {
        setIncident(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ocorrência não encontrada'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">A carregar ocorrência...</div>
      </div>
    );
  }

  const closed = incident.status === 'FECHADA';
  const transitions = INCIDENT_TRANSITIONS[incident.status];

  // Transições simples (sem formulário) aplicam-se logo
  const handleTransition = async (to: IncidentStatus) => {
    if (to === 'RESOLVIDA' || to === 'ABERTA') {
      setTransition(to);
      return;
    }
    try {
      setActionError(null);
      setIncident(await changeIncidentStatus(incident.id, { status: to, author: CURRENT_USER }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao mudar o estado');
    }
  };

  return (
    <div className="p-6">
      <Link href="/incidents" className="text-sm text-slate-500 hover:text-slate-700">
        ← Ocorrências
      </Link>

      <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">#{incident.id}</span>
            <Pill style={incidentStatuses[incident.status]} />
            <Pill style={incidentSeverities[incident.severity]} />
            <Pill style={incidentTypes[incident.type]} />
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{incident.title}</h1>
        </div>

        {transitions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {transitions.map((to) => (
              <button
                key={to}
                type="button"
                onClick={() => handleTransition(to)}
                className={
                  to === 'RESOLVIDA'
                    ? 'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'
                    : 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
                }
              >
                {incidentTransitionLabels[to]}
              </button>
            ))}
          </div>
        )}
      </div>

      {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Descrição, causa e solução */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Descrição</h2>
              {!closed && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Editar
                </button>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{incident.description}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Causa</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {incident.cause || <span className="text-slate-400">Por identificar</span>}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solução</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {incident.solution || <span className="text-slate-400">Por definir</span>}
                </p>
              </div>
            </div>
          </section>

          {/* Cronologia */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Cronologia</h2>
            <ol className="mt-4 space-y-4 border-l border-slate-200 pl-5">
              {incident.updates.map((u) => (
                <li key={u.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400" />
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{u.author}</span>
                    <span>{formatDateTime(u.created_at)}</span>
                    {u.to_status && (
                      <span className="flex items-center gap-1">
                        {u.from_status && (
                          <>
                            <Pill style={incidentStatuses[u.from_status]} />→
                          </>
                        )}
                        <Pill style={incidentStatuses[u.to_status]} />
                      </span>
                    )}
                  </div>
                  {u.note && <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{u.note}</p>}
                </li>
              ))}
            </ol>

            {!closed && <NoteForm incidentId={incident.id} onAdded={setIncident} />}
          </section>
        </div>

        {/* Lateral */}
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Detalhes</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Grupo">
                <Link href={`/groups/${incident.group_code}`} className="font-medium text-sky-700 hover:underline">
                  {incident.group_code}
                </Link>
              </Row>
              {incident.alert_id && (
                <Row label="Alerta de origem">
                  <Link
                    href={`/groups/${incident.group_code}/alerts`}
                    className="font-medium text-sky-700 hover:underline"
                  >
                    #{incident.alert_id}
                  </Link>
                </Row>
              )}
              <Row label="Reportada por">{incident.operator}</Row>
              <Row label="Aberta em">{formatDateTime(incident.opened_at)}</Row>
              {incident.resolved_at && <Row label="Resolvida em">{formatDateTime(incident.resolved_at)}</Row>}
              {incident.closed_at && <Row label="Fechada em">{formatDateTime(incident.closed_at)}</Row>}
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Manutenção</h2>
              {!closed && (
                <button
                  type="button"
                  onClick={() => setScheduling(true)}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  + Agendar
                </button>
              )}
            </div>
            {incident.maintenance_orders.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Sem ordens de manutenção associadas.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {incident.maintenance_orders.map((m) => (
                  <li key={m.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">#{m.id}</span>
                      <Pill style={maintenanceStatuses[m.status]} />
                    </div>
                    <p className="text-slate-700">{m.title}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(m.scheduled_date)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/groups/${incident.group_code}/maintenance`}
              className="mt-3 inline-block text-xs text-sky-700 hover:underline"
            >
              Gerir manutenção do {incident.group_code} →
            </Link>
          </section>
        </div>
      </div>

      {transition && (
        <TransitionDialog
          incident={incident}
          to={transition}
          onClose={() => setTransition(null)}
          onDone={(updated) => {
            setIncident(updated);
            setTransition(null);
          }}
        />
      )}
      {editing && (
        <EditDialog
          incident={incident}
          onClose={() => setEditing(false)}
          onDone={(updated) => {
            setIncident(updated);
            setEditing(false);
          }}
        />
      )}
      {scheduling && (
        <MaintenanceFormDialog
          fixedGroupCode={incident.group_code ?? undefined}
          incident={{ id: incident.id, title: incident.title }}
          onClose={() => setScheduling(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-800">{children}</dd>
    </div>
  );
}

function NoteForm({ incidentId, onAdded }: { incidentId: number; onAdded: (i: IncidentDetail) => void }) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      onAdded(await addIncidentNote(incidentId, CURRENT_USER, note.trim()));
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar a nota');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Adicionar nota..."
        className={fieldClass}
        aria-label="Nova nota"
      />
      <button
        type="submit"
        disabled={submitting || !note.trim()}
        className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        Adicionar
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function TransitionDialog({
  incident,
  to,
  onClose,
  onDone,
}: {
  incident: IncidentDetail;
  to: IncidentStatus;
  onClose: () => void;
  onDone: (i: IncidentDetail) => void;
}) {
  const resolving = to === 'RESOLVIDA';
  const [cause, setCause] = useState(incident.cause ?? '');
  const [solution, setSolution] = useState(incident.solution ?? '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      onDone(
        await changeIncidentStatus(incident.id, {
          status: to,
          author: CURRENT_USER,
          note: note.trim() || undefined,
          ...(resolving ? { cause: cause.trim(), solution: solution.trim() } : {}),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mudar o estado');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={resolving ? 'Resolver ocorrência' : 'Reabrir ocorrência'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {resolving && (
          <>
            <Field label="Causa">
              <textarea value={cause} onChange={(e) => setCause(e.target.value)} rows={2} className={fieldClass} />
            </Field>
            <Field label="Solução aplicada (obrigatória)">
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                rows={3}
                className={fieldClass}
                required
              />
            </Field>
          </>
        )}
        <Field label={resolving ? 'Nota (opcional)' : 'Motivo da reabertura'}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={fieldClass}
            required={!resolving}
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel={resolving ? 'Resolver' : 'Reabrir'} />
      </form>
    </Modal>
  );
}

function EditDialog({
  incident,
  onClose,
  onDone,
}: {
  incident: IncidentDetail;
  onClose: () => void;
  onDone: (i: IncidentDetail) => void;
}) {
  const [title, setTitle] = useState(incident.title);
  const [description, setDescription] = useState(incident.description);
  const [severity, setSeverity] = useState(incident.severity);
  const [cause, setCause] = useState(incident.cause ?? '');
  const [solution, setSolution] = useState(incident.solution ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      onDone(
        await editIncident(incident.id, {
          title: title.trim(),
          description: description.trim(),
          severity,
          cause: cause.trim() || null,
          solution: solution.trim() || null,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Editar ocorrência" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Título">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} required minLength={3} />
            </Field>
          </div>
          <Field label="Severidade">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentDetail['severity'])}
              className={fieldClass}
            >
              {Object.entries(incidentSeverities).map(([v, s]) => (
                <option key={v} value={v}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Descrição">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={fieldClass} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Causa">
            <textarea value={cause} onChange={(e) => setCause(e.target.value)} rows={3} className={fieldClass} />
          </Field>
          <Field label="Solução">
            <textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} className={fieldClass} />
          </Field>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Guardar" />
      </form>
    </Modal>
  );
}
