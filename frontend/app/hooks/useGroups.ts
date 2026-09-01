
// frontend/app/hooks/useGroups.ts
import { useEffect, useState } from 'react';
import { getGroups, Group } from '@/app/services/api';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGroups() {
      try {
        setLoading(true);
        const data = await getGroups();
        setGroups(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar grupos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, []);

  return { groups, loading, error };
}