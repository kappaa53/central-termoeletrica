// frontend/app/hooks/useOperations.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getIncidents,
  getMaintenance,
  Incident,
  IncidentFilters,
  Maintenance,
  MaintenanceFilters,
} from '@/app/services/api';

export const OPERATIONS_PAGE_SIZE = 25;

export function useIncidents(filters: Omit<IncidentFilters, 'limit' | 'offset'>, page: number) {
  const [items, setItems] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const { groupCode, status, severity, type } = filters;

  useEffect(() => {
    let cancelled = false;
    getIncidents({
      groupCode,
      status,
      severity,
      type,
      limit: OPERATIONS_PAGE_SIZE,
      offset: page * OPERATIONS_PAGE_SIZE,
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [groupCode, status, severity, type, page, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const pageCount = Math.max(1, Math.ceil(total / OPERATIONS_PAGE_SIZE));
  return { items, total, pageCount, loading, error, reload };
}

export function useMaintenance(filters: Omit<MaintenanceFilters, 'limit' | 'offset'>, page: number) {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const { groupCode, status, type, overdue } = filters;

  useEffect(() => {
    let cancelled = false;
    getMaintenance({
      groupCode,
      status,
      type,
      overdue,
      limit: OPERATIONS_PAGE_SIZE,
      offset: page * OPERATIONS_PAGE_SIZE,
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [groupCode, status, type, overdue, page, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const pageCount = Math.max(1, Math.ceil(total / OPERATIONS_PAGE_SIZE));
  return { items, total, pageCount, loading, error, reload };
}
