'use client';

import { useState } from 'react';
import Modal, { Field, FormActions, fieldClass } from '@/app/components/ui/Modal';
import { useGroups } from '@/app/hooks/useGroups';
import { maintenancePriorities, maintenanceTypes } from '@/app/lib/constants/operations';
import {
  createMaintenance,
  type MaintenancePriority,
  type MaintenanceType,
} from '@/app/services/api';

function tomorrowAt8(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

type MaintenanceFormDialogProps = {
  onClose: () => void;
  onCreated: () => void;
  fixedGroupCode?: string;
  // Ordem associada a uma ocorrência
  incident?: { id: number; title: string };
};

export default function MaintenanceFormDialog({
  onClose,
  onCreated,
  fixedGroupCode,
  incident,
}: MaintenanceFormDialogProps) {
  const { groups } = useGroups();

  const [groupCode, setGroupCode] = useState(fixedGroupCode ?? '');
  const [type, setType] = useState<MaintenanceType>(incident ? 'CORRETIVA' : 'PREVENTIVA');
  const [title, setTitle] = useState(incident ? `Intervenção: ${incident.title}` : '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>(incident ? 'ALTA' : 'MEDIA');
  const [scheduled, setScheduled] = useState(tomorrowAt8);
  const [technician, setTechnician] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await createMaintenance({
        group_code: groupCode,
        incident_id: incident?.id ?? null,
        type,
        title: title.trim(),
        description: description.trim(),
        priority,
        scheduled_date: `${scheduled}:00`,
        technician: technician.trim(),
        estimated_cost: estimatedCost ? Number(estimatedCost.replace(',', '.')) : null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar a manutenção');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Agendar manutenção" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {incident && (
          <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
            Associada à ocorrência #{incident.id}.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grupo">
            <select
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              className={fieldClass}
              disabled={Boolean(fixedGroupCode)}
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
          <Field label="Data agendada">
            <input
              type="datetime-local"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
              className={fieldClass}
              required
            />
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
            <select value={type} onChange={(e) => setType(e.target.value as MaintenanceType)} className={fieldClass}>
              {Object.entries(maintenanceTypes).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prioridade">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
              className={fieldClass}
            >
              {Object.entries(maintenancePriorities).map(([value, s]) => (
                <option key={value} value={value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Técnico responsável">
            <input
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              className={fieldClass}
              required
            />
          </Field>
          <Field label="Custo estimado (€)">
            <input
              type="number"
              min="0"
              step="1"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>

        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
            rows={3}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Agendar" />
      </form>
    </Modal>
  );
}
