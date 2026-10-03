// frontend/app/hooks/useGroup.ts
'use client';

import { useEffect, useState } from 'react';
import {
  getGroupByCode,
  getLatestReading,
  getReadings,
  Group,
  OperationalReading,
} from '@/app/services/api';

export function useGroup(code: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [latestReading, setLatestReading] = useState<OperationalReading | null>(null);
  const [readings, setReadings] = useState<OperationalReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        const groupData = await getGroupByCode(code);
        setGroup(groupData);

        // Última leitura e histórico das últimas 24 leituras
        const [latest, history] = await Promise.all([
          getLatestReading(groupData.id),
          getReadings({ groupId: groupData.id, limit: 24 }),
        ]);
        setLatestReading(latest);
        setReadings(history);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do grupo');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchGroupData();
    }
  }, [code]);

  return { group, latestReading, readings, loading, error };
}
