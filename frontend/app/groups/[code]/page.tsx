// frontend/app/groups/[code]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import GroupHeader from '@/app/components/GroupHeader';
import PowerChart from '@/app/components/PowerChart';
import { useGroup } from '@/app/hooks/useGroup';
import { averageCurrent, formatDateTime, formatNumber } from '@/app/lib/format';

export default function GroupDetailPage() {
  const params = useParams();
  const code = params.code as string;

  // 48 leituras = 6 dias (8 leituras por dia)
  const { group, latestReading: r, readings, loading, error } = useGroup(code, 48);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">A carregar dados do {code}...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error || 'Grupo não encontrado'}</div>
      </div>
    );
  }

  const loadPct = r?.power != null ? (r.power / group.nominal_power_mw) * 100 : null;

  return (
    <div className="p-6">
      <GroupHeader group={group} active="overview" />

      {/* Ficha técnica */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <InfoCard label="Potência nominal" value={formatNumber(group.nominal_power_mw, 'MW', 3)} />
        <InfoCard label="Cilindros" value={String(group.cylinders)} />
        <InfoCard label="Configuração" value={group.cylinder_configuration} />
        <InfoCard label="Nº série" value={group.serial_number || 'N/A'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Última leitura */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Última leitura</h2>
            <span className="text-sm text-slate-500">{formatDateTime(r?.timestamp)}</span>
          </div>

          {r ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Metric label="Potência ativa" value={formatNumber(r.power, 'MW', 3)} />
              <Metric label="Carga" value={formatNumber(loadPct, '%', 0)} />
              <Metric label="Frequência" value={formatNumber(r.frequency, 'Hz', 2)} />
              <Metric label="Tensão" value={formatNumber(r.voltage, 'V', 0)} />
              <Metric label="Corrente média" value={formatNumber(averageCurrent(r), 'A', 0)} />
              <Metric label="Fator de potência" value={formatNumber(r.power_factor, '', 2)} />
              <Metric label="Potência reativa" value={formatNumber(r.reactive_power, 'MVAr', 3)} />
              <Metric label="Temp. admissão" value={formatNumber(r.intake_temperature, '°C', 1)} />
              <Metric label="Temp. óleo" value={formatNumber(r.oil_temperature, '°C', 1)} />
              <Metric label="Pressão óleo" value={formatNumber(r.oil_pressure, 'bar', 1)} />
              <Metric label="Temp. água" value={formatNumber(r.water_temperature, '°C', 1)} />
              <Metric
                label="Temp. escape (E / D)"
                value={`${formatNumber(r.exhaust_temp_left, '', 0)} / ${formatNumber(r.exhaust_temp_right, '°C', 0)}`}
              />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">Sem leituras registadas para este grupo.</p>
          )}
        </div>

        {/* Resumo */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Resumo</h2>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Fabricante" value={group.manufacturer} />
            <SummaryRow label="Modelo" value={group.engine_model || '—'} />
            <SummaryRow label="Horas de funcionamento" value={formatNumber(r?.operating_hours, 'h', 1)} />
            <SummaryRow label="Energia acumulada" value={formatNumber(r?.energy_produced, 'MWh', 1)} />
            <SummaryRow label="Último operador" value={r?.operator ?? '—'} />
          </div>
        </div>
      </div>

      {/* Histórico de potência */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Potência ativa</h2>
        <p className="mb-4 text-sm text-slate-500">Últimas {readings.length} leituras</p>
        <PowerChart readings={readings} nominalPowerMw={group.nominal_power_mw} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
