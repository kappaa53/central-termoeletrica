
'use client';

import Link from 'next/link';
import { useGroups } from '@/app/hooks/useGroups';
import Badge from '@/app/components/ui/Badge';
import { toGroupStatus } from '@/app/lib/constants/statuses';

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
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Grupos Geradores</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/groups/${group.code}`}
            className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{group.code}</h2>
                <p className="text-sm text-gray-600">{group.manufacturer}</p>
                <p className="text-xs text-gray-500">{group.engine_model || 'Modelo não informado'}</p>
              </div>
              <div className="flex flex-col items-end">
                <Badge status={toGroupStatus(group.status)} />
                <span className="text-xs text-gray-500 mt-1">{group.nominal_power_mw} MW</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}