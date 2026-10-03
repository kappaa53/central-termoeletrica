"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { initials, roleLabels, useAuth } from "@/app/lib/auth";
import type { RoleName } from "@/app/services/api";

type NavItemDef = { label: string; href: string; roles?: RoleName[] };

const navigation: { title: string; items: NavItemDef[] }[] = [
  {
    title: "Operação",
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Grupos", href: "/groups" },
      { label: "Leituras", href: "/readings" },
      { label: "Alertas", href: "/alerts" },
      { label: "Ocorrências", href: "/incidents" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Manutenção", href: "/maintenance" },
      { label: "Estatísticas", href: "/statistics" },
      { label: "Importação", href: "/imports", roles: ["ADMIN", "GESTOR"] },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Utilizadores", href: "/users", roles: ["ADMIN"] },
      { label: "Configurações", href: "/settings" },
    ],
  },
];

const pageInfo: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Visão geral da central termoelétrica" },
  "/groups": { title: "Grupos", description: "Gestão e acompanhamento dos grupos geradores" },
  "/readings": { title: "Leituras", description: "Registo e acompanhamento das leituras operacionais" },
  "/alerts": { title: "Alertas", description: "Monitorização dos alertas da central" },
  "/incidents": { title: "Ocorrências", description: "Registo e acompanhamento de ocorrências" },
  "/maintenance": { title: "Manutenção", description: "Gestão da manutenção dos equipamentos" },
  "/statistics": { title: "Estatísticas", description: "Indicadores e análise histórica" },
  "/imports": { title: "Importação", description: "Importação de dados operacionais" },
  "/users": { title: "Utilizadores", description: "Contas de acesso e perfis" },
  "/settings": { title: "Configurações", description: "Limites de alarme e conta pessoal" },
};

// Páginas acessíveis sem sessão
const PUBLIC_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, hasRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Sem sessão -> página de login
  useEffect(() => {
    if (!loading && !user && !isPublic) router.replace("/login");
  }, [loading, user, isPublic, router]);

  // Fechar o menu móvel ao navegar
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  if (isPublic) return <>{children}</>;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        A verificar sessão...
      </div>
    );
  }

  // Secção atual: "/groups/GG1/readings" -> "/groups"
  const section = pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;
  const currentPage = pageInfo[pathname] ??
    pageInfo[section] ?? { title: "Central Termoelétrica", description: "Sistema de Apoio à Decisão" };

  const sidebar = (
    <>
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="text-lg font-semibold">Central Termoelétrica</div>
        <div className="mt-1 text-xs text-slate-400">Sistema de Apoio à Decisão</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navigation.map((group) => {
          const items = group.items.filter((item) => !item.roles || hasRole(...item.roles));
          if (items.length === 0) return null;
          return (
            <NavSection key={group.title} title={group.title}>
              {items.map((item) => (
                <NavItem key={item.href} label={item.label} href={item.href} active={section === item.href} />
              ))}
            </NavSection>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-6 py-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{user.name}</div>
          <div className="mt-0.5 text-xs text-slate-500">{roleLabels[user.role.name]}</div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Terminar sessão"
          title="Terminar sessão"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
          {sidebar}
        </aside>

        {/* Menu em ecrãs pequenos */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} />
            <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-slate-950 text-white">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Abrir menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">{currentPage.title}</h1>
                <p className="truncate text-xs text-slate-500">{currentPage.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">{roleLabels[user.role.name]}</div>
              </div>
              <Link
                href="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white"
                title="A minha conta"
              >
                {initials(user.name)}
              </Link>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({ label, href, active = false }: { label: string; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2.5 text-sm transition ${
        active ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
