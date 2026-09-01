"use client";

import { useParams } from "next/navigation";
import { useGroup } from "@/app/hooks/useGroup";

export default function GroupDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const { group, latestReading, readings, loading, error } = useGroup(code);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Carregando dados do {code}...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {error || "Grupo não encontrado"}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {group.code} — {group.manufacturer}
        </h2>

        <p className="text-gray-600">
          {group.nominal_power_mw} MW • {group.cylinders} cilindros •{" "}
          {group.cylinder_configuration}
        </p>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Status atual</span>
            <div className="mt-1 text-xl font-semibold">{group.status}</div>
          </div>

          {latestReading && (
            <div className="text-right">
              <span className="text-sm text-gray-600">Última leitura</span>
              <div className="mt-1 text-sm">
                {new Date(latestReading.timestamp).toLocaleString("pt-PT")}
              </div>
            </div>
          )}
        </div>
      </div>

      {latestReading && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <span className="text-sm text-gray-600">Potência</span>
            <div className="mt-1 text-xl font-bold">
              {latestReading.power !== null
                ? `${latestReading.power} kW`
                : "---"}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <span className="text-sm text-gray-600">Horas de operação</span>
            <div className="mt-1 text-xl font-bold">
              {latestReading.operating_hours !== null
                ? `${latestReading.operating_hours} h`
                : "---"}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <span className="text-sm text-gray-600">Temperatura do óleo</span>
            <div className="mt-1 text-xl font-bold">
              {latestReading.oil_temperature !== null
                ? `${latestReading.oil_temperature} °C`
                : "---"}
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow">
            <span className="text-sm text-gray-600">Temperatura da água</span>
            <div className="mt-1 text-xl font-bold">
              {latestReading.water_temperature !== null
                ? `${latestReading.water_temperature} °C`
                : "---"}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Últimas leituras</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Data/hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Potência (kW)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Frequência (Hz)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Temp. do óleo (°C)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Temp. da água (°C)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {readings.slice(0, 10).map((reading) => (
                <tr key={reading.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(reading.timestamp).toLocaleString("pt-PT")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {reading.power !== null ? reading.power : "---"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {reading.frequency !== null ? reading.frequency : "---"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {reading.oil_temperature !== null
                      ? reading.oil_temperature
                      : "---"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {reading.water_temperature !== null
                      ? reading.water_temperature
                      : "---"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}