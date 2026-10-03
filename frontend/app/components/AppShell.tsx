"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = {
  operacao: [
    { label: "Dashboard", href: "/" },
    { label: "Grupos", href: "/groups" },
    { label: "Leituras", href: "/readings" },
    { label: "Alertas", href: "/alerts" },
    { label: "Ocorrências", href: "/incidents" },
  ],
  gestao: [
    { label: "Manutenção", href: "/maintenance" },
    { label: "Estatísticas", href: "/statistics" },
    { label: "Importação", href: "/imports" },
  ],
  sistema: [{ label: "Configurações", href: "/settings" }],
};

const pageInfo: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Dashboard",
    description: "Visão geral da central termoelétrica",
  },
  "/groups": {
    title: "Grupos",
    description: "Gestão e acompanhamento dos grupos geradores",
  },
  "/readings": {
    title: "Leituras",
    description: "Registo e acompanhamento das leituras operacionais",
  },
  "/alerts": {
    title: "Alertas",
    description: "Monitorização dos alertas da central",
  },
  "/incidents": {
    title: "Ocorrências",
    description: "Registo e acompanhamento de ocorrências",
  },
  "/maintenance": {
    title: "Manutenção",
    description: "Gestão da manutenção dos equipamentos",
  },
  "/statistics": {
    title: "Estatísticas",
    description: "Indicadores e análise histórica",
  },
  "/imports": {
    title: "Importação",
    description: "Importação de dados operacionais",
  },
  "/settings": {
    title: "Configurações",
    description: "Configuração do sistema",
  },
};

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Secção atual: "/groups/GG1/readings" -> "/groups"
  const section = pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;

  const currentPage = pageInfo[pathname] ?? pageInfo[section] ?? {
    title: "Central Termoelétrica",
    description: "Sistema de Apoio à Decisão",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-6 py-5">
            <div className="text-lg font-semibold">Central Termoelétrica</div>
            <div className="mt-1 text-xs text-slate-400">
              Sistema de Apoio à Decisão
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <NavSection title="Operação">
              {navigation.operacao.map((item) => (
                <NavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  active={section === item.href}
                />
              ))}
            </NavSection>

            <NavSection title="Gestão">
              {navigation.gestao.map((item) => (
                <NavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  active={section === item.href}
                />
              ))}
            </NavSection>

            <NavSection title="Sistema">
              {navigation.sistema.map((item) => (
                <NavItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  active={section === item.href}
                />
              ))}
            </NavSection>
          </nav>

          <div className="border-t border-slate-800 px-6 py-4">
            <div className="text-sm font-medium">Operador</div>
            <div className="mt-1 text-xs text-slate-500">
              Sistema operacional
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div>
              <h1 className="text-xl font-semibold">{currentPage.title}</h1>
              <p className="text-xs text-slate-500">
                {currentPage.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Sistema operacional
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                OP
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function NavItem({
  label,
  href,
  active = false,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2.5 text-sm transition ${
        active
          ? "bg-white/10 font-medium text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}