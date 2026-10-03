// frontend/app/hooks/useGroup.ts
'use client';

import { useEffect, useState } from 'react';
import {
  getGroupByCode,
  getGroupReadings,
  getLatestReading,
  Group,
  OperationalReading,
} from '@/app/services/api';

export function useGroup(code: string, historySize = 24) {
  const [group, setGroup] = useState<Group | null>(null);
  const [latestReading, setLatestReading] = useState<OperationalReading | null>(null);
  const [readings, setReadings] = useState<OperationalReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        // Dados do grupo, última leitura e histórico recente
        const [groupData, latest, history] = await Promise.all([
          getGroupByCode(code),
          getLatestReading(code),
          getGroupReadings(code, historySize),
        ]);
        setGroup(groupData);
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
  }, [code, historySize]);

  return { group, latestReading, readings, loading, error };
}
