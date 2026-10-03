// frontend/app/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { MANAGEMENT_ROLES, roleLabels, useAuth } from '@/app/lib/auth';
import { formatDateTime } from '@/app/lib/format';
import {
  changePassword,
  getThresholds,
  rebuildAlerts,
  updateThreshold,
  type AlertThreshold,
} from '@/app/services/api';

const inputBase =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-500';
const inputClass = `w-full ${inputBase}`;

export default function SettingsPage() {
  const { user, hasRole } = useAuth();
  if (!user) return null;

  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">A minha conta</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Nome" value={user.name} />
          <Row label="Utilizador" value={user.username} />
          <Row label="Perfil" value={roleLabels[user.role.name]} />
          <Row label="Último acesso" value={formatDateTime(user.last_login_at)} />
        </dl>
        <PasswordForm />
      </section>

      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ThresholdsEditor canEdit={hasRole(...MANAGEMENT_ROLES)} canRebuild={hasRole('ADMIN')} />
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setMessage({ ok: false, text: 'A confirmação não coincide com a nova palavra-passe.' });
      return;
    }
    try {
      setSubmitting(true);
      setMessage(null);
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setMessage({ ok: true, text: 'Palavra-passe alterada com sucesso.' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Erro ao alterar' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
      <h3 className="text-sm font-semibold text-slate-900">Alterar palavra-passe</h3>
      <input
        type="password"
        placeholder="Palavra-passe atual"
        aria-label="Palavra-passe atual"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        className={inputClass}
        autoComplete="current-password"
        required
      />
      <input
        type="password"
        placeholder="Nova palavra-passe (mín. 8)"
        aria-label="Nova palavra-passe"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className={inputClass}
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        required
      />
      <input
        type="password"
        placeholder="Confirmar nova palavra-passe"
        aria-label="Confirmar nova palavra-passe"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={inputClass}
        autoComplete="new-password"
        required
      />
      {message && <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? 'A guardar...' : 'Alterar palavra-passe'}
      </button>
    </form>
  );
}

type Draft = Record<'warning_min' | 'warning_max' | 'critical_min' | 'critical_max', string> & { active: boolean };

const toDraft = (t: AlertThreshold): Draft => ({
  warning_min: t.warning_min?.toString() ?? '',
  warning_max: t.warning_max?.toString() ?? '',
  critical_min: t.critical_min?.toString() ?? '',
  critical_max: t.critical_max?.toString() ?? '',
  active: t.active,
});

const toNumber = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

function ThresholdsEditor({ canEdit, canRebuild }: { canEdit: boolean; canRebuild: boolean }) {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [status, setStatus] = useState<Record<number, string>>({});
  const [changed, setChanged] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);

  useEffect(() => {
    getThresholds()
      .then((list) => {
        setThresholds(list);
        setDrafts(Object.fromEntries(list.map((t) => [t.id, toDraft(t)])));
      })
      .catch(console.error);
  }, []);

  const setField = (id: number, key: keyof Draft, value: string | boolean) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: value } }));

  const isDirty = (t: AlertThreshold) => JSON.stringify(drafts[t.id]) !== JSON.stringify(toDraft(t));

  const save = async (t: AlertThreshold) => {
    const d = drafts[t.id];
    try {
      setStatus((s) => ({ ...s, [t.id]: 'A guardar...' }));
      const updated = await updateThreshold(t.id, {
        warning_min: toNumber(d.warning_min),
        warning_max: toNumber(d.warning_max),
        critical_min: toNumber(d.critical_min),
        critical_max: toNumber(d.critical_max),
        active: d.active,
      });
      setThresholds((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      setDrafts((all) => ({ ...all, [t.id]: toDraft(updated) }));
      setStatus((s) => ({ ...s, [t.id]: 'Guardado' }));
      setChanged(true);
    } catch (err) {
      setStatus((s) => ({ ...s, [t.id]: err instanceof Error ? err.message : 'Erro' }));
    }
  };

  const rebuild = async () => {
    if (
      !window.confirm(
        'Recalcular todos os alertas a partir do histórico de leituras?\n\nOs reconhecimentos e resoluções manuais existentes serão perdidos.',
      )
    )
      return;
    try {
      setRebuildMsg('A recalcular...');
      const r = await rebuildAlerts();
      setRebuildMsg(`Alertas recalculados: ${r.total_alerts}.`);
      setChanged(false);
    } catch (err) {
      setRebuildMsg(err instanceof Error ? err.message : 'Erro ao recalcular');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Limites de alarme</h2>
          <p className="mt-1 text-sm text-slate-500">
            Um valor fora destes limites, num grupo em operação, gera um alerta.
            {!canEdit && ' Apenas gestores e administradores podem alterar os limites.'}
          </p>
        </div>
        {canRebuild && (
          <button
            type="button"
            onClick={rebuild}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
              changed ? 'bg-amber-500 text-white hover:bg-amber-600' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Recalcular alertas
          </button>
        )}
      </div>
      {changed && canRebuild && (
        <p className="mt-2 text-xs text-amber-700">
          Os novos limites aplicam-se às próximas leituras. Use &quot;Recalcular alertas&quot; para os aplicar ao histórico.
        </p>
      )}
      {rebuildMsg && <p className="mt-2 text-sm text-slate-600">{rebuildMsg}</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-3 font-semibold">Parâmetro</th>
              <th className="px-2 py-2 font-semibold text-red-700">Crítico mín.</th>
              <th className="px-2 py-2 font-semibold text-amber-700">Aviso mín.</th>
              <th className="px-2 py-2 font-semibold text-amber-700">Aviso máx.</th>
              <th className="px-2 py-2 font-semibold text-red-700">Crítico máx.</th>
              <th className="px-2 py-2 font-semibold">Ativo</th>
              {canEdit && <th className="py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {thresholds.map((t) => {
              const d = drafts[t.id];
              if (!d) return null;
              return (
                <tr key={t.id}>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-slate-900">{t.label}</div>
                    <div className="text-xs text-slate-400">{t.unit || '—'}</div>
                  </td>
                  {(['critical_min', 'warning_min', 'warning_max', 'critical_max'] as const).map((key) => (
                    <td key={key} className="px-2 py-2">
                      <input
                        type="number"
                        step="any"
                        aria-label={`${t.label}: ${key}`}
                        value={d[key]}
                        onChange={(e) => setField(t.id, key, e.target.value)}
                        disabled={!canEdit}
                        placeholder="—"
                        className={`${inputBase} w-20`}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={d.active}
                      onChange={(e) => setField(t.id, 'active', e.target.checked)}
                      disabled={!canEdit}
                      aria-label={`${t.label}: ativo`}
                      className="h-4 w-4"
                    />
                  </td>
                  {canEdit && (
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => save(t)}
                        disabled={!isDirty(t)}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        Guardar
                      </button>
                      {status[t.id] && <div className="mt-1 text-xs text-slate-500">{status[t.id]}</div>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
