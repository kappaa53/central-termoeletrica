// frontend/app/users/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Modal, { Field, FormActions, fieldClass, filterClass } from '@/app/components/ui/Modal';
import { roleLabels, useAuth } from '@/app/lib/auth';
import { formatDateTime } from '@/app/lib/format';
import {
  createUser,
  getUsers,
  resetUserPassword,
  updateUser,
  type RoleName,
  type User,
} from '@/app/services/api';

const roleOrder: RoleName[] = ['ADMIN', 'GESTOR', 'OPERADOR'];

export default function UsersPage() {
  const { user: me, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<User | null>(null);
  const isAdmin = hasRole('ADMIN');

  const load = useCallback(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar utilizadores'));
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return <p className="p-6 text-slate-600">Esta área está reservada a administradores.</p>;
  }

  const change = async (u: User, changes: Parameters<typeof updateUser>[1]) => {
    try {
      setError(null);
      const updated = await updateUser(u.id, changes);
      setUsers((list) => list.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          <strong>Operador:</strong> leituras, alertas e ocorrências · <strong>Gestor:</strong> também manutenção,
          limites e importação · <strong>Administrador:</strong> acesso total.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <PlusIcon className="h-4 w-4" />
          Novo utilizador
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Nome</th>
              <th className="px-5 py-3 font-semibold">Utilizador</th>
              <th className="px-5 py-3 font-semibold">Perfil</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold">Último acesso</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const self = u.id === me?.id;
              return (
                <tr key={u.id} className={u.active ? '' : 'text-slate-400'}>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {u.name}
                    {self && <span className="ml-2 text-xs font-normal text-slate-400">(você)</span>}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-5 py-3">
                    <select
                      aria-label={`Perfil de ${u.name}`}
                      value={u.role.name}
                      onChange={(e) => change(u, { role: e.target.value as RoleName })}
                      className={filterClass}
                      disabled={self}
                    >
                      {roleOrder.map((r) => (
                        <option key={r} value={r}>
                          {roleLabels[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => change(u, { active: !u.active })}
                      disabled={self}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed ${
                        u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                      title={self ? 'Não pode desativar a sua própria conta' : 'Clique para alterar'}
                    >
                      {u.active ? 'Ativa' : 'Desativada'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.last_login_at ? formatDateTime(u.last_login_at) : 'Nunca'}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setResetting(u)}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      Redefinir palavra-passe
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {creating && <CreateUserDialog onClose={() => setCreating(false)} onCreated={load} />}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}

function CreateUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<RoleName>('OPERADOR');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await createUser({ name: name.trim(), username: username.trim().toLowerCase(), role, password });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar o utilizador');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Novo utilizador" onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="Nome completo">
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required minLength={2} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Utilizador">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
              placeholder="ex.: joao.silva"
              pattern="[a-zA-Z0-9._\-]{3,50}"
              title="3 a 50 caracteres: letras, números, ponto, hífen ou sublinhado"
              autoCapitalize="none"
              required
            />
          </Field>
          <Field label="Perfil">
            <select value={role} onChange={(e) => setRole(e.target.value as RoleName)} className={fieldClass}>
              {roleOrder.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Palavra-passe inicial (mín. 8 caracteres)">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
          />
        </Field>
        <p className="text-xs text-slate-500">
          Comunique a palavra-passe ao utilizador e peça-lhe que a altere em Configurações.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} submitting={submitting} submitLabel="Criar utilizador" />
      </form>
    </Modal>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await resetUserPassword(user.id, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Redefinir palavra-passe: ${user.name}`} onClose={onClose}>
      {done ? (
        <div>
          <p className="text-sm text-emerald-700">Palavra-passe redefinida.</p>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Nova palavra-passe (mín. 8 caracteres)">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <FormActions onCancel={onClose} submitting={submitting} submitLabel="Redefinir" />
        </form>
      )}
    </Modal>
  );
}
