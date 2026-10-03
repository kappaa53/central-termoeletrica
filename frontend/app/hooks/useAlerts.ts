// frontend/app/hooks/useAlerts.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertFilters, getAlerts } from '@/app/services/api';

export const ALERTS_PAGE_SIZE = 25;

export function useAlerts(filters: Omit<AlertFilters, 'limit' | 'offset'>, page: number) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const { groupCode, status, severity } = filters;

  useEffect(() => {
    let cancelled = false;

    getAlerts({
      groupCode,
      status,
      severity,
      limit: ALERTS_PAGE_SIZE,
      offset: page * ALERTS_PAGE_SIZE,
    })
      .then((data) => {
        if (cancelled) return;
        setAlerts(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar alertas');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [groupCode, status, severity, page, version]);

  // Recarregar depois de reconhecer/resolver
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const pageCount = Math.max(1, Math.ceil(total / ALERTS_PAGE_SIZE));

  return { alerts, total, pageCount, loading, error, reload };
}
