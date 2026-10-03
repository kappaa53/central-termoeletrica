// frontend/app/groups/[code]/alerts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import AlertCard from '@/app/components/AlertCard';
import GroupHeader from '@/app/components/GroupHeader';
import Pagination from '@/app/components/Pagination';
import { useAlerts } from '@/app/hooks/useAlerts';
import { getGroupByCode, Group } from '@/app/services/api';

export default function GroupAlertsPage() {
  const params = useParams();
  const code = params.code as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [page, setPage] = useState(0);

  const { alerts, total, pageCount, loading, error, reload } = useAlerts(
    { groupCode: code, status: onlyOpen ? 'OPEN' : undefined },
    page,
  );

  useEffect(() => {
    getGroupByCode(code)
      .then(setGroup)
      .catch(() => setGroupError('Grupo não encontrado'));
  }, [code]);

  if (groupError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{groupError}</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">A carregar dados do {code}...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <GroupHeader group={group} active="alerts" />

      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => {
              setOnlyOpen(e.target.checked);
              setPage(0);
            }}
            className="h-4 w-4 rounded border-slate-300"
          />
          Mostrar só alertas abertos
        </label>

        <Link href="/alerts" className="text-sm text-slate-600 hover:text-slate-900">
          Ver alertas de todos os grupos →
        </Link>
      </div>

      <div className="space-y-3">
        {error ? (
          <p className="py-16 text-center text-red-500">{error}</p>
        ) : loading ? (
          <p className="py-16 text-center text-slate-500">A carregar alertas...</p>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <CheckCircleIcon className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
            <p className="text-slate-600">
              {onlyOpen ? `Sem alertas abertos para o ${code}.` : `Nenhum alerta registado para o ${code}.`}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} showGroup={false} onChanged={reload} />
          ))
        )}
      </div>

      {total > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            shown={alerts.length}
            onChange={setPage}
            itemLabel="alertas"
          />
        </div>
      )}
    </div>
  );
}
