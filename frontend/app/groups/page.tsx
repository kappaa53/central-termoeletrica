'use client';

import Link from 'next/link';
import { useGroups } from '@/app/hooks/useGroups';
import { GroupCard } from '@/app/components/GroupCard';

export default function GroupsPage() {
  const { groups, loading, error } = useGroups();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando grupos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Erro: {error}
      </div>
    );
  }

  // Ordenar grupos por código (GG1, GG2, ...)
  const sortedGroups = [...groups].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grupos Geradores</h1>
        <p className="text-gray-600">Visão geral de todos os grupos geradores da central</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedGroups.map((group) => (
          <Link key={group.id} href={`/groups/${group.code}`}>
            <GroupCard group={group} />
          </Link>
        ))}
      </div>
    </div>
  );
}