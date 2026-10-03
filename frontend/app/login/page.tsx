// frontend/app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BoltIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/app/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Já autenticado -> ir para o dashboard
  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await login(username.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar sessão');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400">
            <BoltIcon className="h-7 w-7 text-slate-950" />
          </div>
          <h1 className="text-2xl font-semibold">Central Termoelétrica</h1>
          <p className="mt-1 text-sm text-slate-400">Sistema de Apoio à Decisão</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900">Iniciar sessão</h2>
          <p className="mt-1 text-sm text-slate-500">Acesso reservado a operadores e gestão.</p>

          <label className="mt-5 grid gap-1.5 text-sm font-medium text-slate-700">
            Utilizador
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              required
            />
          </label>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">
            Palavra-passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting ? 'A entrar...' : 'Entrar'}
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Esqueceu-se da palavra-passe? Contacte o administrador do sistema.
          </p>
        </form>
      </div>
    </div>
  );
}
