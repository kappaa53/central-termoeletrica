// Formatação comum (pt-PT)

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '--:--';
  return new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

export function formatNumber(
  value: number | null | undefined,
  unit = '',
  digits = 1,
): string {
  if (value === null || value === undefined) return '—';
  const n = value.toLocaleString('pt-PT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return unit ? `${n} ${unit}` : n;
}

export function averageCurrent(r: {
  current_r: number | null;
  current_s: number | null;
  current_t: number | null;
}): number | null {
  const values = [r.current_r, r.current_s, r.current_t].filter(
    (v): v is number => v !== null,
  );
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
