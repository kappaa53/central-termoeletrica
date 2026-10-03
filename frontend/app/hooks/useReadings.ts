// frontend/app/hooks/useReadings.ts
'use client';

import { useEffect, useState } from 'react';
import { getReadings, OperationalReading, ReadingFilters } from '@/app/services/api';

export const READINGS_PAGE_SIZE = 50;

// Leituras paginadas a partir da API, com filtros
export function useReadings(filters: Omit<ReadingFilters, 'limit' | 'offset'>, page: number) {
  const [readings, setReadings] = useState<OperationalReading[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { groupCode, status, start, end } = filters;

  useEffect(() => {
    let cancelled = false;

    getReadings({
      groupCode,
      status,
      start,
      end,
      limit: READINGS_PAGE_SIZE,
      offset: page * READINGS_PAGE_SIZE,
    })
      .then((data) => {
        if (cancelled) return;
        setReadings(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar leituras');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupCode, status, start, end, page]);

  const pageCount = Math.max(1, Math.ceil(total / READINGS_PAGE_SIZE));

  return { readings, total, pageCount, loading, error };
}
