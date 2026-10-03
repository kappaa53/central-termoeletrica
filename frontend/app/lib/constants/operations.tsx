// Rótulos e estilos de ocorrências e manutenção
import type {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from '@/app/services/api';

type Style = { label: string; className: string };

export const incidentTypes: Record<IncidentType, Style> = {
  ELETRICA: { label: 'Elétrica', className: 'bg-violet-50 text-violet-700' },
  MECANICA: { label: 'Mecânica', className: 'bg-orange-50 text-orange-700' },
  OPERACIONAL: { label: 'Operacional', className: 'bg-sky-50 text-sky-700' },
  SEGURANCA: { label: 'Segurança', className: 'bg-rose-50 text-rose-700' },
  OUTROS: { label: 'Outros', className: 'bg-slate-100 text-slate-700' },
};

export const incidentSeverities: Record<IncidentSeverity, Style> = {
  CRITICA: { label: 'Crítica', className: 'bg-red-600 text-white' },
  ALTA: { label: 'Alta', className: 'bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-600/20' },
  MEDIA: { label: 'Média', className: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20' },
  BAIXA: { label: 'Baixa', className: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/20' },
};

export const incidentStatuses: Record<IncidentStatus, Style> = {
  ABERTA: { label: 'Aberta', className: 'bg-red-50 text-red-700' },
  EM_ANALISE: { label: 'Em análise', className: 'bg-amber-50 text-amber-800' },
  EM_EXECUCAO: { label: 'Em execução', className: 'bg-sky-50 text-sky-700' },
  RESOLVIDA: { label: 'Resolvida', className: 'bg-emerald-50 text-emerald-700' },
  FECHADA: { label: 'Fechada', className: 'bg-slate-100 text-slate-600' },
};

// Texto dos botões de transição
export const incidentTransitionLabels: Record<IncidentStatus, string> = {
  ABERTA: 'Reabrir',
  EM_ANALISE: 'Iniciar análise',
  EM_EXECUCAO: 'Iniciar execução',
  RESOLVIDA: 'Resolver',
  FECHADA: 'Fechar',
};

export const maintenanceTypes: Record<MaintenanceType, Style> = {
  PREVENTIVA: { label: 'Preventiva', className: 'bg-sky-50 text-sky-700' },
  CORRETIVA: { label: 'Corretiva', className: 'bg-orange-50 text-orange-700' },
  PREDITIVA: { label: 'Preditiva', className: 'bg-violet-50 text-violet-700' },
  URGENTE: { label: 'Urgente', className: 'bg-red-50 text-red-700' },
};

export const maintenancePriorities: Record<MaintenancePriority, Style> = {
  ALTA: { label: 'Alta', className: 'text-red-700' },
  MEDIA: { label: 'Média', className: 'text-amber-700' },
  BAIXA: { label: 'Baixa', className: 'text-slate-600' },
};

export const maintenanceStatuses: Record<MaintenanceStatus, Style> = {
  AGENDADA: { label: 'Agendada', className: 'bg-slate-100 text-slate-700' },
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-sky-50 text-sky-700' },
  CONCLUIDA: { label: 'Concluída', className: 'bg-emerald-50 text-emerald-700' },
  CANCELADA: { label: 'Cancelada', className: 'bg-slate-100 text-slate-500 line-through' },
};

export function Pill({ style }: { style: Style }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.className}`}>{style.label}</span>
  );
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}
