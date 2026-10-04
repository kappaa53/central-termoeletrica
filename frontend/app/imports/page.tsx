// frontend/app/imports/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Modal from '@/app/components/ui/Modal';
import { MANAGEMENT_ROLES, useAuth } from '@/app/lib/auth';
import { formatDateTime } from '@/app/lib/format';
import {
  downloadImportTemplate,
  getImportBatches,
  getImportErrors,
  previewImport,
  runImport,
  type ImportBatch,
  type ImportPreview,
  type ImportRowError,
} from '@/app/services/api';

const statusStyles: Record<ImportBatch['status'], { label: string; className: string }> = {
  COMPLETED: { label: 'Concluída', className: 'bg-emerald-50 text-emerald-700' },
  PARTIAL: { label: 'Parcial', className: 'bg-amber-50 text-amber-800' },
  FAILED: { label: 'Falhou', className: 'bg-red-50 text-red-700' },
};

// Colunas mostradas na amostra
const SAMPLE_COLUMNS: [string, string][] = [
  ['group_code', 'Grupo'],
  ['timestamp', 'Data e hora'],
  ['status', 'Estado'],
  ['operator', 'Operador'],
  ['power', 'Potência (MW)'],
  ['oil_temperature', 'Temp. óleo'],
  ['oil_pressure', 'Pressão óleo'],
  ['water_temperature', 'Temp. água'],
];

export default function ImportsPage() {
  const { hasRole } = useAuth();
  const canImport = hasRole(...MANAGEMENT_ROLES);

  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportBatch | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showErrorsOf, setShowErrorsOf] = useState<ImportBatch | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadBatches = useCallback(() => {
    getImportBatches().then(setBatches).catch(console.error);
  }, []);

  useEffect(() => {
    if (canImport) loadBatches();
  }, [canImport, loadBatches]);

  if (!canImport) {
    return <p className="p-6 text-slate-600">A importação de dados está reservada a gestores e administradores.</p>;
  }

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const selectFile = async (f: File | undefined) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
      setError('Formato não suportado. Use um ficheiro Excel (.xlsx) ou CSV.');
      return;
    }
    setFile(f);
    setPreview(null);
    setResult(null);
    setError(null);
    try {
      setBusy('preview');
      setPreview(await previewImport(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar o ficheiro');
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    if (!file) return;
    try {
      setBusy('import');
      setError(null);
      const batch = await runImport(file);
      setResult(batch);
      reset();
      loadBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setBusy(null);
    }
  };

  const blocked = Boolean(preview && (preview.missing_required.length > 0 || preview.valid_rows === 0));

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Importar leituras operacionais</h2>
            <p className="mt-1 text-sm text-slate-500">
              Excel (.xlsx) ou CSV, até 5 MB. Colunas obrigatórias: Grupo, Data e hora e Estado.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadImportTemplate().catch((e) => setError(e.message))}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descarregar modelo
          </button>
        </div>

        {result && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              result.status === 'FAILED' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
            }`}
            role="status"
          >
            <strong>{result.filename}:</strong> {result.successful_rows} de {result.total_rows} linhas importadas
            {result.error_rows > 0 && `, ${result.error_rows} com erro`}
            {result.alerts_created > 0 && ` · ${result.alerts_created} alerta(s) gerado(s)`}.
          </div>
        )}

        {!preview && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              selectFile(e.dataTransfer.files[0]);
            }}
            className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
              dragActive ? 'border-slate-500 bg-slate-50' : 'border-slate-300'
            }`}
          >
            <ArrowUpTrayIcon className="h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600">
              {busy === 'preview' ? `A analisar ${file?.name}...` : 'Arraste o ficheiro para aqui ou'}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy !== null}
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Escolher ficheiro
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {preview && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <DocumentTextIcon className="h-5 w-5 text-slate-400" />
              <span className="font-medium text-slate-900">{preview.filename}</span>
              <Stat label="linhas" value={preview.total_rows} />
              <Stat label="válidas" value={preview.valid_rows} tone="ok" />
              <Stat label="com erro" value={preview.error_rows} tone={preview.error_rows ? 'bad' : undefined} />
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colunas</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.columns.map((c) => (
                  <span
                    key={c.header}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      c.field ? 'bg-sky-50 text-sky-800' : 'bg-slate-100 text-slate-400 line-through'
                    }`}
                    title={c.field ? `Reconhecida como: ${c.label}` : 'Coluna não reconhecida (ignorada)'}
                  >
                    {c.header}
                  </span>
                ))}
              </div>
              {preview.missing_required.length > 0 && (
                <p className="mt-2 text-sm text-red-700">
                  Colunas obrigatórias em falta: <strong>{preview.missing_required.join(', ')}</strong>
                </p>
              )}
            </div>

            {preview.errors.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Linhas com erro {preview.errors.length >= 100 && '(primeiras 100)'}
                </h3>
                <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Linha</th>
                        <th className="px-3 py-2 font-semibold">Coluna</th>
                        <th className="px-3 py-2 font-semibold">Erro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.errors.map((e, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 tabular-nums text-slate-500">{e.row_number}</td>
                          <td className="px-3 py-1.5 text-slate-700">{e.column ?? '—'}</td>
                          <td className="px-3 py-1.5 text-red-700">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {preview.sample.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amostra das linhas válidas
                </h3>
                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        {SAMPLE_COLUMNS.map(([, label]) => (
                          <th key={label} className="whitespace-nowrap px-3 py-2 font-semibold">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.sample.map((row, i) => (
                        <tr key={i}>
                          {SAMPLE_COLUMNS.map(([key]) => (
                            <td key={key} className="whitespace-nowrap px-3 py-1.5 tabular-nums text-slate-700">
                              {key === 'timestamp' && row[key]
                                ? formatDateTime(String(row[key]))
                                : typeof row[key] === 'number'
                                  ? row[key].toLocaleString('pt-PT')
                                  : (row[key] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
              {preview.error_rows > 0 && !blocked && (
                <p className="text-sm text-slate-500 sm:mr-auto">
                  As linhas com erro não serão importadas e ficam registadas no histórico.
                </p>
              )}
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={doImport}
                disabled={blocked || busy !== null}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {busy === 'import'
                  ? 'A importar...'
                  : `Importar ${preview.valid_rows} linha${preview.valid_rows === 1 ? '' : 's'} válida${preview.valid_rows === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Histórico de importações</h2>
        </div>
        {batches.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Ainda não foram feitas importações.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Ficheiro</th>
                  <th className="px-5 py-3 font-semibold">Por</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Importadas</th>
                  <th className="px-5 py-3 text-right font-semibold">Com erro</th>
                  <th className="px-5 py-3 text-right font-semibold">Alertas</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDateTime(b.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{b.filename}</span>
                      <span className="ml-2 text-xs text-slate-400">{b.file_type}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{b.created_by}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[b.status].className}`}>
                        {statusStyles[b.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {b.successful_rows} / {b.total_rows}
                    </td>
                    <td className="px-5 py-3 text-right">{b.error_rows}</td>
                    <td className="px-5 py-3 text-right">{b.alerts_created}</td>
                    <td className="px-5 py-3 text-right">
                      {b.error_rows > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowErrorsOf(b)}
                          className="text-sm text-slate-600 hover:text-slate-900"
                        >
                          Ver erros
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showErrorsOf && <BatchErrorsDialog batch={showErrorsOf} onClose={() => setShowErrorsOf(null)} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'bad' }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : tone === 'bad' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
      }`}
    >
      <strong className="tabular-nums">{value.toLocaleString('pt-PT')}</strong> {label}
    </span>
  );
}

function BatchErrorsDialog({ batch, onClose }: { batch: ImportBatch; onClose: () => void }) {
  const [errors, setErrors] = useState<ImportRowError[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    getImportErrors(batch.id)
      .then(setErrors)
      .catch((err) => setFailed(err instanceof Error ? err.message : 'Erro'));
  }, [batch.id]);

  const summarize = (raw: string | null) => {
    if (!raw) return '';
    try {
      return Object.entries(JSON.parse(raw) as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
    } catch {
      return raw;
    }
  };

  return (
    <Modal title={`Erros: ${batch.filename}`} onClose={onClose} size="lg">
      {failed && <p className="text-sm text-red-600">{failed}</p>}
      {!errors && !failed && <p className="text-sm text-slate-500">A carregar...</p>}
      {errors && (
        <div className="max-h-[60vh] overflow-auto">
          <ul className="divide-y divide-slate-100 text-sm">
            {errors.map((e) => (
              <li key={e.id} className="py-2">
                <div>
                  <span className="tabular-nums text-slate-500">Linha {e.row_number}</span>
                  {e.column && <span className="ml-2 text-slate-700">{e.column}</span>}
                  <span className="ml-2 text-red-700">{e.error_message}</span>
                </div>
                {e.raw_data && <p className="mt-0.5 truncate text-xs text-slate-400">{summarize(e.raw_data)}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
