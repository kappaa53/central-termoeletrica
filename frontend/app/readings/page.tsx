export default function ReadingsPage() {
  return <Page title="Leituras" description="Registo e acompanhamento das leituras operacionais." />;
}

function Page({ title, description }: { title: string; description: string }) {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">{description}</p>
    </main>
  );
}
