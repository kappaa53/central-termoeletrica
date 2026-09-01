"use client";

import { useMemo, useState } from "react";
import Badge from "@/app/components/ui/Badge";
import { mockReadings } from "@/app/lib/mock/readings";
import { groupStatusLabels } from "@/app/lib/constants/statuses";
import type { GroupStatus } from "@/app/types/reading";

const groupOptions = [
  "Todos",
  "GG1",
  "GG2",
  "GG3",
  "GG4",
  "GG5",
  "GG6",
  "GG7",
  "GG8",
  "GG9",
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatValue(value: number | null, unit: string, digits = 1) {
  if (value === null) return "—";

  return `${value.toLocaleString("pt-PT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ${unit}`;
}

export default function ReadingsPage() {
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState<"TODOS" | GroupStatus>(
    "TODOS",
  );

  const readings = useMemo(() => {
    return mockReadings.filter((reading) => {
      const matchesGroup =
        selectedGroup === "Todos" || reading.groupCode === selectedGroup;

      const matchesStatus =
        selectedStatus === "TODOS" || reading.groupStatus === selectedStatus;

      return matchesGroup && matchesStatus;
    });
  }, [selectedGroup, selectedStatus]);

  const activeReadings = readings.filter(
    (reading) => reading.groupStatus === "EM_OPERACAO",
  ).length;

  return (
    <div className="p-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Leituras apresentadas"
          value={String(readings.length)}
          description="Conforme os filtros aplicados"
        />
        <SummaryCard
          label="Grupos em operação"
          value={String(activeReadings)}
          description="Entre as leituras apresentadas"
        />
        <SummaryCard
          label="Última atualização"
          value="14:30"
          description="01/09/2026"
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Grupo gerador
              <select
                value={selectedGroup}
                onChange={(event) => setSelectedGroup(event.target.value)}
                className="min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {groupOptions.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Estado operacional
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target.value as "TODOS" | GroupStatus,
                  )
                }
                className="min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="TODOS">Todos os estados</option>
                <option value="EM_OPERACAO">
                  {groupStatusLabels.EM_OPERACAO}
                </option>
                <option value="PARADO">{groupStatusLabels.PARADO}</option>
                <option value="MANUTENCAO">
                  {groupStatusLabels.MANUTENCAO}
                </option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() =>
              window.alert(
                "O formulário de nova leitura será criado na próxima etapa.",
              )
            }
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Nova leitura
          </button>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Registo de leituras operacionais
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe as medições mais recentes de cada grupo gerador.
          </p>
        </div>

        {readings.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="font-medium text-slate-700">
              Nenhuma leitura encontrada.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ajuste os filtros para consultar outros registos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <TableHead>Data e hora</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Potência</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Temp. óleo</TableHead>
                  <TableHead>Temp. água</TableHead>
                  <TableHead>Pressão óleo</TableHead>
                  <TableHead>Operador</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {readings.map((reading) => (
                  <tr
                    key={reading.id}
                    className="transition hover:bg-slate-50/80"
                    title={reading.statusReason}
                  >
                    <TableCell>{formatDateTime(reading.readingDatetime)}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-900">
                        {reading.groupCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge status={reading.groupStatus} />
                    </TableCell>
                    <TableCell>{formatValue(reading.powerMw, "MW", 2)}</TableCell>
                    <TableCell>
                      {formatValue(reading.frequencyHz, "Hz", 2)}
                    </TableCell>
                    <TableCell>
                      {formatValue(reading.oilTemperatureC, "°C", 1)}
                    </TableCell>
                    <TableCell>
                      {formatValue(reading.waterTemperatureC, "°C", 1)}
                    </TableCell>
                    <TableCell>
                      {formatValue(reading.oilPressureBar, "bar", 1)}
                    </TableCell>
                    <TableCell>{reading.operatorName}</TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            A mostrar {readings.length} de {mockReadings.length} leituras
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-400"
            >
              Anterior
            </button>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
              1
            </span>
            <button
              type="button"
              disabled
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-400"
            >
              Seguinte
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}