// frontend/app/hooks/useGroup.ts
'use client';

import { useEffect, useState } from 'react';
import { api, Group, OperationalReading } from '@/app/services/api';

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
        const groupData = await api.getGroupByCode(code);
        setGroup(groupData);
        
        // Buscar última leitura
        const latest = await api.getLatestReading(groupData.id);
        setLatestReading(latest);
        
        // Buscar últimas 24 leituras
        const history = await api.getReadings(groupData.id, 24);
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