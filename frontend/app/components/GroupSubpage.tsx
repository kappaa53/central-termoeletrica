'use client';

import { useEffect, useState } from 'react';
import GroupHeader, { type GroupTab } from '@/app/components/GroupHeader';
import { getGroupByCode, Group } from '@/app/services/api';

// Carrega o grupo e mostra o cabeçalho com as tabs
export default function GroupSubpage({
  code,
  active,
  children,
}: {
  code: string;
  active: GroupTab;
  children: (group: Group) => React.ReactNode;
}) {
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGroupByCode(code)
      .then(setGroup)
      .catch(() => setError('Grupo não encontrado'));
  }, [code]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
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
      <GroupHeader group={group} active={active} />
      {children(group)}
    </div>
  );
}
