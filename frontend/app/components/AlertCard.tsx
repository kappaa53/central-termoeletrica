'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import IncidentFormDialog from '@/app/components/IncidentFormDialog';
import { CURRENT_USER } from '@/app/lib/currentUser';
import { formatDateTime, formatNumber } from '@/app/lib/format';
import {
  acknowledgeAlert,
  resolveAlert,
  type Alert,
  type AlertSeverity,
  type AlertStatus,
  type IncidentType,
} from '@/app/services/api';

// Parâmetros elétricos/operacionais vs. mecânicos (para pré-preencher a ocorrência)
const incidentTypeByParameter: Record<string, IncidentType> = {
  frequency: 'ELETRICA',
  voltage: 'ELETRICA',
  load_pct: 'OPERACIONAL',
};

export const severityConfig: Record<
  AlertSeverity,
  { label: string; badge: string; border: string; icon: typeof XCircleIcon; iconColor: string }
> = {
  CRITICAL: {
    label: 'Crítico',
    badge: 'bg-red-50 text-red-700 ring-red-600/20',
    border: 'border-l-red-600',
    icon: XCircleIcon,
    iconColor: 'text-red-600',
  },
  WARNING: {
    label: 'Aviso',
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    border: 'border-l-amber-500',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-amber-500',
  },
};

export const alertStatusLabels: Record<AlertStatus, string> = {
  ACTIVE: 'Ativo',
  ACKNOWLEDGED: 'Reconhecido',
  RESOLVED: 'Resolvido',
};

const statusBadge: Record<AlertStatus, string> = {
  ACTIVE: 'bg-red-50 text-red-700',
  ACKNOWLEDGED: 'bg-slate-100 text-slate-700',
  RESOLVED: 'bg-emerald-50 text-emerald-700',
};

type AlertCardProps = {
  alert: Alert;
  showGroup?: boolean;
  onChanged?: () => void;
};

export default function AlertCard({ alert, showGroup = true, onChanged }: AlertCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingIncident, setOpeningIncident] = useState(false);

  const sev = severityConfig[alert.severity];
  const Icon = sev.icon;
  const resolved = alert.status === 'RESOLVED';
  const unit = alert.unit ?? '';
  const digits = Math.abs(alert.value) >= 100 ? 0 : 1;

  const run = async (action: typeof acknowledgeAlert) => {
    try {
      setBusy(true);
      setError(null);
      await action(alert.id, CURRENT_USER);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar o alerta');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm ${sev.border} ${
        resolved ? 'opacity-75' : ''
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${sev.iconColor}`} aria-hidden="true" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${sev.badge}`}>
                {sev.label}
              </span>
              <span className={`rounded-full px-2 py-0.5 font-medium ${statusBadge[alert.status]}`}>
                {alertStatusLabels[alert.status]}
              </span>
              {showGroup && alert.group_code && (
                <Link
                  href={`/groups/${alert.group_code}`}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  {alert.group_code}
                </Link>
              )}
              <span className="text-slate-500">{formatDateTime(alert.created_at)}</span>
            </div>

            <p className="mt-1.5 font-medium text-slate-900">{alert.message}</p>

            <p className="mt-1 text-sm text-slate-600">
              {alert.parameter_label}: <strong className="tabular-nums">{formatNumber(alert.value, unit, digits)}</strong>
              <span className="mx-2 text-slate-300">|</span>
              Limite: <strong className="tabular-nums">{formatNumber(alert.threshold, unit, digits)}</strong>
            </p>

            {(alert.acknowledged_by || alert.resolved_at) && (
              <p className="mt-1 text-xs text-slate-500">
                {alert.acknowledged_by &&
                  `Reconhecido por ${alert.acknowledged_by} em ${formatDateTime(alert.acknowledged_at)}`}
                {alert.acknowledged_by && alert.resolved_at && ' · '}
                {alert.resolved_at &&
                  `Resolvido por ${alert.resolved_by ?? '—'} em ${formatDateTime(alert.resolved_at)}`}
              </p>
            )}

            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpeningIncident(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Abrir ocorrência
          </button>
          {!resolved && (
            <>
              {alert.status === 'ACTIVE' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(acknowledgeAlert)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Reconhecer
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => run(resolveAlert)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                Resolver
              </button>
            </>
          )}
        </div>
      </div>

      {openingIncident && (
        <IncidentFormDialog
          onClose={() => setOpeningIncident(false)}
          initial={{
            group_code: alert.group_code ?? undefined,
            alert_id: alert.id,
            title: alert.message,
            type: incidentTypeByParameter[alert.parameter] ?? 'MECANICA',
            severity: alert.severity === 'CRITICAL' ? 'CRITICA' : 'MEDIA',
            description: `${alert.parameter_label}: ${formatNumber(alert.value, unit, digits)} (limite ${formatNumber(
              alert.threshold,
              unit,
              digits,
            )}) em ${formatDateTime(alert.created_at)}.`,
          }}
        />
      )}
    </div>
  );
}
