// frontend/app/groups/[code]/maintenance/page.tsx
'use client';

import { useParams } from 'next/navigation';
import GroupSubpage from '@/app/components/GroupSubpage';
import MaintenanceList from '@/app/components/MaintenanceList';

export default function GroupMaintenancePage() {
  const code = useParams().code as string;

  return (
    <GroupSubpage code={code} active="maintenance">
      {(group) => <MaintenanceList fixedGroupCode={group.code} />}
    </GroupSubpage>
  );
}
