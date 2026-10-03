// frontend/app/groups/[code]/readings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import GroupHeader from '@/app/components/GroupHeader';
import Pagination from '@/app/components/Pagination';
import ReadingsTable from '@/app/components/ReadingsTable';
import { useReadings } from '@/app/hooks/useReadings';
import { getGroupByCode, Group } from '@/app/services/api';

export default function GroupReadingsPage() {
  const params = useParams();
  const code = params.code as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const { readings, total, pageCount, loading, error } = useReadings({ groupCode: code }, page);

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
      <GroupHeader group={group} active="readings" />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Histórico de leituras do {group.code}</h2>
          <p className="mt-1 text-sm text-slate-500">Mais recentes primeiro.</p>
        </div>

        {error ? (
          <p className="px-5 py-16 text-center text-red-500">{error}</p>
        ) : loading ? (
          <p className="px-5 py-16 text-center text-slate-500">A carregar leituras...</p>
        ) : (
          <ReadingsTable readings={readings} showGroup={false} />
        )}

        <Pagination page={page} pageCount={pageCount} total={total} shown={readings.length} onChange={setPage} />
      </section>
    </div>
  );
}
