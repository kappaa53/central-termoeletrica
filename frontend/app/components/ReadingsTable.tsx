'use client';

import Badge from '@/app/components/ui/Badge';
import { toGroupStatus } from '@/app/lib/constants/statuses';
import { averageCurrent, formatDateTime, formatNumber } from '@/app/lib/format';
import type { OperationalReading } from '@/app/services/api';

type ReadingsTableProps = {
  readings: OperationalReading[];
  showGroup?: boolean;
  emptyMessage?: string;
};

export default function ReadingsTable({
  readings,
  showGroup = true,
  emptyMessage = 'Nenhuma leitura encontrada.',
}: ReadingsTableProps) {
  if (readings.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="font-medium text-slate-700">{emptyMessage}</p>
        <p className="mt-1 text-sm text-slate-500">
          Ajuste os filtros para consultar outros registos.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <TableHead>Data e hora</TableHead>
            {showGroup && <TableHead>Grupo</TableHead>}
            <TableHead>Estado</TableHead>
            <TableHead align="right">Potência</TableHead>
            <TableHead align="right">Frequência</TableHead>
            <TableHead align="right">Tensão</TableHead>
            <TableHead align="right">Corrente média</TableHead>
            <TableHead align="right">FP</TableHead>
            <TableHead align="right">Temp. óleo</TableHead>
            <TableHead align="right">Pressão óleo</TableHead>
            <TableHead align="right">Temp. água</TableHead>
            <TableHead>Operador</TableHead>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {readings.map((r) => (
            <tr key={r.id} className="transition hover:bg-slate-50/80">
              <TableCell>{formatDateTime(r.timestamp)}</TableCell>
              {showGroup && (
                <TableCell>
                  <span className="font-semibold text-slate-900">{r.group_code}</span>
                </TableCell>
              )}
              <TableCell>
                <Badge status={toGroupStatus(r.status)} />
              </TableCell>
              <TableCell align="right">{formatNumber(r.power, 'MW', 3)}</TableCell>
              <TableCell align="right">{formatNumber(r.frequency, 'Hz', 2)}</TableCell>
              <TableCell align="right">{formatNumber(r.voltage, 'V', 0)}</TableCell>
              <TableCell align="right">{formatNumber(averageCurrent(r), 'A', 0)}</TableCell>
              <TableCell align="right">{formatNumber(r.power_factor, '', 2)}</TableCell>
              <TableCell align="right">{formatNumber(r.oil_temperature, '°C', 1)}</TableCell>
              <TableCell align="right">{formatNumber(r.oil_pressure, 'bar', 1)}</TableCell>
              <TableCell align="right">{formatNumber(r.water_temperature, '°C', 1)}</TableCell>
              <TableCell>{r.operator}</TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHead({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        align === 'right' ? 'text-right' : ''
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      className={`whitespace-nowrap px-5 py-4 text-sm text-slate-600 ${
        align === 'right' ? 'text-right tabular-nums' : ''
      }`}
    >
      {children}
    </td>
  );
}
