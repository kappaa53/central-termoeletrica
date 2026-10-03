'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'lg';
};

export default function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  // Fechar com Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`w-full rounded-xl bg-white shadow-xl ${size === 'lg' ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const fieldBase =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200';

export const fieldClass = `w-full ${fieldBase}`;

// Para filtros em linha (largura automática)
export const filterClass = fieldBase;

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

export function FormActions({
  onCancel,
  submitting,
  submitLabel,
}: {
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? 'A guardar...' : submitLabel}
      </button>
    </div>
  );
}
