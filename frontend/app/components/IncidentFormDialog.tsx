'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal, { Field, FormActions, fieldClass } from '@/app/components/ui/Modal';
import { useGroups } from '@/app/hooks/useGroups';
import { incidentSeverities, incidentTypes } from '@/app/lib/constants/operations';
import { useAuth } from '@/app/lib/auth';
import {
  createIncident,
  type IncidentInput,
  type IncidentSeverity,
  type IncidentType,
} from '@/app/services/api';

type IncidentFormDialogProps = {
  onClose: () => void;
  // Valores iniciais (ex.: a partir de um alerta)
  initial?: Partial<IncidentInput>;
  // Grupo fixo (página de um grupo)
  fixedGroupCode?: string;
};

export default function IncidentFormDialog({ onClose, initial, fixedGroupCode }: IncidentFormDialogProps) {
  const router = useRouter();
  const { groups } = useGroups();
  const { user } = useAuth();

  const [groupCode, setGroupCode] = useState(fixedGroupCode ?? initial?.group_code ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState<IncidentType>(initial?.type ?? 'MECANICA');
  const [severity, setSeverity] = useState<IncidentSeverity>(initial?.severity ?? 'MEDIA');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const incident = await createIncident({
        group_code: groupCode,
        alert_id: initial?.alert_id ?? null,
        title: title.trim(),
        type,
        severity,
        description: description.trim(),
      });
      router.push(`/incidents/${incident.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar a ocorrência');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Nova ocorrência" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {initial?.alert_id && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Ocorrência associada ao alerta #{initial.alert_id}.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grupo">
            <select
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              className={fieldClass}
              disabled={Boolean(fixedGroupCode || initial?.alert_id)}
              required
            >
              <option value="" disabled>
                Selecionar...
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.code}>
                  {g.code}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reportada por">
            <input value={user?.name ?? ''} className={`${fieldClass} bg-slate-50 text-slate-500`} disabled />
          </Field>
        </div>

        <Field label="Título">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClass}
            required
            minLength={3}
            maxLength={200}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo">
            <select value={type} onChange={(e) => setType(e.target.value as IncidentType)} className={fieldClass}>
              {Object.entries(incidentTypes).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Severidade">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className={fieldClass}
            >
              {Object.entries(incidentSeverities).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
            rows={4}
            required
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Abrir ocorrência" />
      </form>
    </Modal>
  );
}
