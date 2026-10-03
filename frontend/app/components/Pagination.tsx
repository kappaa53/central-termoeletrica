'use client';

type PaginationProps = {
  page: number; // base 0
  pageCount: number;
  total: number;
  shown: number;
  onChange: (page: number) => void;
  itemLabel?: string;
};

export default function Pagination({
  page,
  pageCount,
  total,
  shown,
  onChange,
  itemLabel = 'leituras',
}: PaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        A mostrar {shown} de {total.toLocaleString('pt-PT')} {itemLabel}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent"
        >
          Anterior
        </button>
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent"
        >
          Seguinte
        </button>
      </div>
    </div>
  );
}
