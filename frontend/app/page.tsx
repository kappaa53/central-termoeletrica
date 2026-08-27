import Link from "next/link";
const groups = [
  {
    id: "GG1",
    type: "Guascor",
    power: "0,952 MW",
    status: "Operacional",
  },
  {
    id: "GG2",
    type: "Guascor",
    power: "0,952 MW",
    status: "Operacional",
  },
  {
    id: "GG3",
    type: "Guascor",
    power: "0,952 MW",
    status: "Parado",
  },
  {
    id: "GG4",
    type: "Guascor",
    power: "0,952 MW",
    status: "Operacional",
  },
  {
    id: "GG5",
    type: "Guascor",
    power: "0,952 MW",
    status: "Operacional",
  },
  {
    id: "GG6",
    type: "Guascor",
    power: "0,952 MW",
    status: "Alerta",
  },
  {
    id: "GG7",
    type: "Guascor",
    power: "0,952 MW",
    status: "Operacional",
  },
  {
    id: "GG8",
    type: "Waukesha",
    power: "2,4 MW",
    status: "Operacional",
  },
  {
    id: "GG9",
    type: "Waukesha",
    power: "2,4 MW",
    status: "Manutenção",
  },
];

const statusStyles: Record<string, string> = {
  Operacional: "bg-emerald-50 text-emerald-700",
  Parado: "bg-slate-100 text-slate-600",
  Alerta: "bg-amber-50 text-amber-700",
  Manutenção: "bg-blue-50 text-blue-700",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-6 py-5">
            <div className="text-lg font-semibold">
              Central Termoeléctrica
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Sistema de Apoio à Decisão
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Operação
            </div>

            <div className="space-y-1">
              <NavItem label="Dashboard" href="/" active />
              <NavItem label="Grupos" href="/groups" />
              <NavItem label="Leituras" href="/readings" />
              <NavItem label="Alertas" href="/alerts" />
              <NavItem label="Ocorrências" href="/incidents" />
            </div>

            <div className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gestão
            </div>

            <div className="space-y-1">
             <NavItem label="Manutenção" href="/maintenance" />
             <NavItem label="Estatísticas" href="/statistics" />
             <NavItem label="Importação" href="/imports" />
            </div>

            <div className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sistema
            </div>

            <div className="space-y-1">
              <NavItem label="Configurações" href="/settings" />
            </div>
          </nav>

          <div className="border-t border-slate-800 px-6 py-4">
            <div className="text-sm font-medium">Operador</div>
            <div className="mt-1 text-xs text-slate-500">
              Sistema operacional
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div>
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <p className="text-xs text-slate-500">
                Visão geral da central termoeléctrica
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

          <div className="p-6">
            {/* Summary */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Potência instalada"
                value="12,46 MW"
                subtitle="9 grupos"
              />

              <StatCard
                title="Grupos operacionais"
                value="6"
                subtitle="de 9 grupos"
              />

              <StatCard
                title="Potência atual"
                value="7,21 MW"
                subtitle="produção estimada"
              />

              <StatCard
                title="Alertas activos"
                value="3"
                subtitle="1 crítico"
                danger
              />
            </section>

            {/* Groups */}
            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Estado dos grupos geradores
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Situação operacional dos GG1 a GG9
                  </p>
                </div>

                <button className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:block">
                  Ver todos
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold">
                          {group.id}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {group.type}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[group.status]}`}
                      >
                        {group.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <div className="text-xs text-slate-400">
                          Potência nominal
                        </div>
                        <div className="mt-1 text-sm font-semibold">
                          {group.power}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-400">
                          Última leitura
                        </div>
                        <div className="mt-1 text-sm font-semibold">
                          --:--
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Lower panels */}
            <section className="mt-8 grid gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">Alertas recentes</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Últimos eventos que requerem atenção
                    </p>
                  </div>

                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    3 activos
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <AlertRow
                    group="GG6"
                    message="Temperatura elevada"
                    severity="Crítico"
                  />
                  <AlertRow
                    group="GG3"
                    message="Grupo parado"
                    severity="Aviso"
                  />
                  <AlertRow
                    group="GG9"
                    message="Manutenção em curso"
                    severity="Informação"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="font-semibold">Resumo operacional</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Indicadores da operação actual
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  <ProgressRow
                    label="Disponibilidade"
                    value="86%"
                    percent={86}
                  />
                  <ProgressRow
                    label="Carga média"
                    value="71%"
                    percent={71}
                  />
                  <ProgressRow
                    label="Eficiência operacional"
                    value="82%"
                    percent={82}
                  />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
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

function StatCard({
  title,
  value,
  subtitle,
  danger = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div
        className={`mt-2 text-2xl font-bold ${
          danger ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}

function AlertRow({
  group,
  message,
  severity,
}: {
  group: string;
  message: string;
  severity: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <div>
        <div className="text-sm font-medium">{group}</div>
        <div className="text-xs text-slate-500">{message}</div>
      </div>

      <span className="text-xs font-medium text-slate-600">{severity}</span>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-800"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}