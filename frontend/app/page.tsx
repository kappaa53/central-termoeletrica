"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/app/components/ui/Badge";
import { toGroupStatus } from "@/app/lib/constants/statuses";
import { formatDateTime, formatNumber, formatTime } from "@/app/lib/format";
import { DashboardSummary, getDashboardSummary } from "@/app/services/api";

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setError("Não foi possível carregar os dados da central."));
  }, []);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">A carregar dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Potência instalada"
          value={formatNumber(summary.installed_power_mw, "MW", 2)}
          subtitle={`${summary.total_groups} grupos`}
        />

        <StatCard
          title="Grupos em operação"
          value={String(summary.operating_groups)}
          subtitle={`de ${summary.total_groups} · ${summary.stopped_groups} parado(s) · ${summary.maintenance_groups} em manutenção`}
        />

        <StatCard
          title="Potência atual"
          value={formatNumber(summary.current_power_mw, "MW", 2)}
          subtitle={`Leituras de ${formatDateTime(summary.last_reading_at)}`}
        />

        <StatCard
          title="Energia produzida (24h)"
          value={formatNumber(summary.energy_24h_mwh, "MWh", 1)}
          subtitle="Até à última leitura"
        />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Estado dos grupos geradores
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Situação operacional dos {summary.groups[0]?.code} a{" "}
              {summary.groups[summary.groups.length - 1]?.code}
            </p>
          </div>

          <Link
            href="/groups"
            className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:block"
          >
            Ver todos
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summary.groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.code}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{group.code}</div>

                  <div className="mt-1 text-sm text-slate-500">
                    {group.manufacturer}
                  </div>
                </div>

                <Badge status={toGroupStatus(group.status)} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-xs text-slate-400">Potência</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {formatNumber(group.power_mw, "", 2)} /{" "}
                    {formatNumber(group.nominal_power_mw, "MW", 2)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Temp. óleo</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {formatNumber(group.oil_temperature, "°C", 1)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Última leitura</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {formatTime(group.last_reading_at)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold">Alertas recentes</h2>

            <p className="mt-1 text-sm text-slate-500">
              Últimos eventos que requerem atenção
            </p>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Monitorização automática de alertas em desenvolvimento.
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold">Resumo operacional</h2>

            <p className="mt-1 text-sm text-slate-500">
              Indicadores calculados a partir das últimas leituras
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <ProgressRow
              label="Disponibilidade (grupos fora de manutenção)"
              value={formatNumber(summary.availability_pct, "%", 0)}
              percent={summary.availability_pct}
            />

            <ProgressRow
              label="Fator de carga (grupos em operação)"
              value={formatNumber(summary.load_factor_pct, "%", 0)}
              percent={summary.load_factor_pct}
            />

            <ProgressRow
              label="Capacidade em operação"
              value={`${formatNumber(summary.operating_capacity_mw, "MW", 2)} (${formatNumber(summary.operating_capacity_pct, "%", 0)})`}
              percent={summary.operating_capacity_pct}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  danger = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>

      <div
        className={`mt-2 text-2xl font-bold ${
          danger ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-800"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}