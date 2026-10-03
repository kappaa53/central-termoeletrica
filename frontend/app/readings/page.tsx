"use client";

import { useState } from "react";
import NewReadingDialog from "@/app/components/NewReadingDialog";
import Pagination from "@/app/components/Pagination";
import ReadingsTable from "@/app/components/ReadingsTable";
import { useGroups } from "@/app/hooks/useGroups";
import { useReadings } from "@/app/hooks/useReadings";
import { formatDateTime } from "@/app/lib/format";

// Valores de estado tal como são guardados no backend
const statusOptions = [
  { value: "", label: "Todos os estados" },
  { value: "Em operação", label: "Em operação" },
  { value: "Parado", label: "Parado" },
  { value: "Manutenção", label: "Em manutenção" },
];

const inputClass =
  "min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export default function ReadingsPage() {
  const { groups } = useGroups();

  const [groupCode, setGroupCode] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { readings, total, pageCount, loading, error, reload } = useReadings(
    {
      groupCode: groupCode || undefined,
      status: status || undefined,
      start: startDate ? `${startDate}T00:00:00` : undefined,
      end: endDate ? `${endDate}T23:59:59` : undefined,
    },
    page,
  );

  // Qualquer alteração de filtro volta à primeira página
  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(0);
    };

  const hasFilters = groupCode || status || startDate || endDate;

  const clearFilters = () => {
    setGroupCode("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const operatingOnPage = readings.filter((r) => r.status === "Em operação").length;

  return (
    <div className="p-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Leituras encontradas"
          value={total.toLocaleString("pt-PT")}
          description="Conforme os filtros aplicados"
        />
        <SummaryCard
          label="Em operação"
          value={`${operatingOnPage} de ${readings.length}`}
          description="Leituras desta página"
        />
        <SummaryCard
          label="Leitura mais recente"
          value={readings.length ? formatDateTime(readings[0].timestamp) : "—"}
          description="Entre os resultados filtrados"
        />
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Grupo gerador
              <select
                value={groupCode}
                onChange={(e) => withReset(setGroupCode)(e.target.value)}
                className={inputClass}
              >
                <option value="">Todos</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.code}>
                    {g.code}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Estado operacional
              <select
                value={status}
                onChange={(e) => withReset(setStatus)(e.target.value)}
                className={inputClass}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              De
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => withReset(setStartDate)(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Até
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => withReset(setEndDate)(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex gap-2">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            )}
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              disabled={groups.length === 0}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Nova leitura
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Registo de leituras operacionais</h2>
          <p className="mt-1 text-sm text-slate-500">
            Medições de todos os grupos geradores, mais recentes primeiro.
          </p>
        </div>

        {error ? (
          <p className="px-5 py-16 text-center text-red-500">{error}</p>
        ) : loading ? (
          <p className="px-5 py-16 text-center text-slate-500">A carregar leituras...</p>
        ) : (
          <ReadingsTable readings={readings} />
        )}

        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          shown={readings.length}
          onChange={setPage}
        />
      </section>

      {dialogOpen && (
        <NewReadingDialog
          groups={groups}
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            setPage(0);
            reload();
          }}
        />
      )}
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
