'use client';

import Link from 'next/link';
import Badge from '@/app/components/ui/Badge';
import { toGroupStatus } from '@/app/lib/constants/statuses';
import type { Group } from '@/app/services/api';

export type GroupTab = 'overview' | 'readings' | 'alerts' | 'incidents' | 'maintenance';

const tabs: { id: GroupTab; label: string; path: string }[] = [
  { id: 'overview', label: 'Visão Geral', path: '' },
  { id: 'readings', label: 'Leituras', path: '/readings' },
  { id: 'alerts', label: 'Alertas', path: '/alerts' },
  { id: 'incidents', label: 'Ocorrências', path: '/incidents' },
  { id: 'maintenance', label: 'Manutenção', path: '/maintenance' },
];

export default function GroupHeader({ group, active }: { group: Group; active: GroupTab }) {
  return (
    <>
      <div className="mb-6">
        <Link href="/groups" className="text-sm text-slate-500 hover:text-slate-700">
          ← Grupos
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{group.code}</h1>
            <p className="text-slate-600">
              {group.manufacturer} - {group.engine_model || 'Modelo não informado'}
            </p>
          </div>
          <Badge status={toGroupStatus(group.status)} />
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/groups/${group.code}${tab.path}`}
              className={`border-b-2 px-1 py-2 ${
                tab.id === active
                  ? 'border-slate-900 font-medium text-slate-900'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
