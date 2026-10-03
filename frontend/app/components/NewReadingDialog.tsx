'use client';

import { useState } from 'react';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/lib/auth';
import {
  createReading,
  type Group,
  type ReadingCreateResult,
  type ReadingInput,
} from '@/app/services/api';

type NumericField = Exclude<keyof ReadingInput, 'group_code' | 'timestamp' | 'operator' | 'status'>;

const fieldSections: { title: string; fields: { key: NumericField; label: string; unit: string; step: string }[] }[] = [
  {
    title: 'Elétricos',
    fields: [
      { key: 'power', label: 'Potência ativa', unit: 'MW', step: '0.001' },
      { key: 'reactive_power', label: 'Potência reativa', unit: 'MVAr', step: '0.001' },
      { key: 'frequency', label: 'Frequência', unit: 'Hz', step: '0.01' },
      { key: 'voltage', label: 'Tensão', unit: 'V', step: '0.1' },
      { key: 'current_r', label: 'Corrente R', unit: 'A', step: '0.1' },
      { key: 'current_s', label: 'Corrente S', unit: 'A', step: '0.1' },
      { key: 'current_t', label: 'Corrente T', unit: 'A', step: '0.1' },
      { key: 'power_factor', label: 'Fator de potência', unit: '', step: '0.01' },
    ],
  },
  {
    title: 'Motor',
    fields: [
      { key: 'oil_temperature', label: 'Temp. óleo', unit: '°C', step: '0.1' },
      { key: 'oil_pressure', label: 'Pressão óleo', unit: 'bar', step: '0.1' },
      { key: 'water_temperature', label: 'Temp. água', unit: '°C', step: '0.1' },
      { key: 'intake_temperature', label: 'Temp. admissão', unit: '°C', step: '0.1' },
      { key: 'exhaust_temp_left', label: 'Temp. escape esq.', unit: '°C', step: '1' },
      { key: 'exhaust_temp_right', label: 'Temp. escape dir.', unit: '°C', step: '1' },
    ],
  },
  {
    title: 'Contadores',
    fields: [
      { key: 'operating_hours', label: 'Horas de funcionamento', unit: 'h', step: '0.1' },
      { key: 'energy_produced', label: 'Energia acumulada', unit: 'MWh', step: '0.001' },
    ],
  },
];

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

function localNow(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

type NewReadingDialogProps = {
  groups: Group[];
  onClose: () => void;
  onCreated: () => void;
};

export default function NewReadingDialog({ groups, onClose, onCreated }: NewReadingDialogProps) {
  const [groupCode, setGroupCode] = useState(groups[0]?.code ?? '');
  const [timestamp, setTimestamp] = useState(localNow);
  const { user } = useAuth();
  // Por omissão, o utilizador autenticado (pode registar em nome de outro operador)
  const [operator, setOperator] = useState(user?.name ?? '');
  const [status, setStatus] = useState<ReadingInput['status']>('Em operação');
  const [values, setValues] = useState<Partial<Record<NumericField, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadingCreateResult | null>(null);

  const operating = status === 'Em operação';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const measurements: Partial<Record<NumericField, number>> = {};
    for (const [key, raw] of Object.entries(values)) {
      if (!raw?.trim()) continue;
      const n = Number(raw.replace(',', '.'));
      if (Number.isNaN(n)) {
        setError(`Valor inválido em "${key}".`);
        return;
      }
      measurements[key as NumericField] = n;
    }

    try {
      setSubmitting(true);
      const res = await createReading({
        group_code: groupCode,
        timestamp: `${timestamp}:00`,
        operator: operator.trim(),
        status,
        ...measurements,
      });
      setResult(res);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registar a leitura');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnother = () => {
    setResult(null);
    setValues({});
    setTimestamp(localNow());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-reading-title"
    >
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="new-reading-title" className="text-lg font-semibold text-slate-900">
            Nova leitura
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          <div className="px-6 py-6">
            <p className="font-medium text-emerald-700">
              Leitura do {result.reading.group_code} registada com sucesso.
            </p>
            {result.evaluated ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li>Alertas criados: <strong>{result.alerts_created}</strong></li>
                <li>Alertas escalados para crítico: <strong>{result.alerts_escalated}</strong></li>
                <li>Alertas resolvidos (valores normalizados): <strong>{result.alerts_resolved}</strong></li>
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                Já existe uma leitura mais recente deste grupo, por isso esta não foi usada para avaliar alertas.
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {(result.alerts_created > 0 || result.alerts_escalated > 0) && (
                <Link
                  href={`/groups/${result.reading.group_code}/alerts`}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ver alertas do grupo
                </Link>
              )}
              <button
                type="button"
                onClick={resetForAnother}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Registar outra
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Grupo
                <select value={groupCode} onChange={(e) => setGroupCode(e.target.value)} className={inputClass} required>
                  {groups.map((g) => (
                    <option key={g.id} value={g.code}>
                      {g.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Data e hora
                <input
                  type="datetime-local"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className={inputClass}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Operador
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className={inputClass}
                  required
                  maxLength={100}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Estado
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReadingInput['status'])}
                  className={inputClass}
                >
                  <option value="Em operação">Em operação</option>
                  <option value="Parado">Parado</option>
                  <option value="Manutenção">Em manutenção</option>
                </select>
              </label>
            </div>

            {operating ? (
              fieldSections.map((section) => (
                <fieldset key={section.title} className="mt-5">
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {section.title}
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {section.fields.map((f) => (
                      <label key={f.key} className="grid gap-1 text-sm text-slate-700">
                        <span>
                          {f.label}
                          {f.unit && <span className="text-slate-400"> ({f.unit})</span>}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step={f.step}
                          value={values[f.key] ?? ''}
                          onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                          className={inputClass}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))
            ) : (
              <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Grupo fora de operação: as medições não são necessárias e o grupo passa a ter o estado
                selecionado.
              </p>
            )}

            <p className="mt-4 text-xs text-slate-500">
              Os campos de medição são opcionais. Ao registar, os valores são comparados com os limites de alarme.
            </p>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !groupCode}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {submitting ? 'A registar...' : 'Registar leitura'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
