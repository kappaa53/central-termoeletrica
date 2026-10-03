// frontend/app/groups/[code]/incidents/page.tsx
'use client';

import { useParams } from 'next/navigation';
import GroupSubpage from '@/app/components/GroupSubpage';
import IncidentList from '@/app/components/IncidentList';

export default function GroupIncidentsPage() {
  const code = useParams().code as string;

  return (
    <GroupSubpage code={code} active="incidents">
      {(group) => <IncidentList fixedGroupCode={group.code} />}
    </GroupSubpage>
  );
}
