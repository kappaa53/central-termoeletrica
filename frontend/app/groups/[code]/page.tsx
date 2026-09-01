// frontend/app/groups/[code]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getGroupByCode, Group } from '@/app/services/api';

export default function GroupDetailPage() {
  const params = useParams();
  const code = params.code as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGroup() {
      try {
        setLoading(true);
        const data = await getGroupByCode(code);
        setGroup(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do grupo');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      loadGroup();
    }
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando dados do {code}...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error || 'Grupo não encontrado'}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header do Grupo */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.code}</h1>
            <p className="text-gray-600">
              {group.manufacturer} - {group.engine_model || 'Modelo não informado'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              group.status === 'Operando' ? 'bg-green-100 text-green-800' :
              group.status === 'Parado' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {group.status}
            </span>
          </div>
        </div>
      </div>

      {/* Cards de Informações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Potência Nominal</div>
          <div className="text-xl font-semibold">{group.nominal_power_mw} MW</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Cilindros</div>
          <div className="text-xl font-semibold">{group.cylinders}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Configuração</div>
          <div className="text-xl font-semibold">{group.cylinder_configuration}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Nº Série</div>
          <div className="text-xl font-semibold">{group.serial_number || 'N/A'}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <Link
            href={`/groups/${code}`}
            className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium"
          >
            Visão Geral
          </Link>
          <Link
            href={`/groups/${code}/readings`}
            className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Leituras
          </Link>
          <Link
            href={`/groups/${code}/alerts`}
            className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Alertas
          </Link>
          <Link
            href={`/groups/${code}/maintenance`}
            className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Manutenção
          </Link>
        </nav>
      </div>

      {/* Conteúdo da Visão Geral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados Operacionais - Mock por enquanto */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Dados Operacionais</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">Temperatura do Motor</div>
                <div className="text-2xl font-bold">-- °C</div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">Pressão do Óleo</div>
                <div className="text-2xl font-bold">-- bar</div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">Carga Atual</div>
                <div className="text-2xl font-bold">-- MW</div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">RPM</div>
                <div className="text-2xl font-bold">--</div>
              </div>
            </div>
            <div className="text-center text-gray-400 text-sm py-4">
              Dados em tempo real em desenvolvimento
            </div>
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Resumo</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Status</span>
              <span className={`font-medium ${
                group.status === 'Operando' ? 'text-green-600' :
                group.status === 'Parado' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {group.status}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Fabricante</span>
              <span className="font-medium">{group.manufacturer}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Última Leitura</span>
              <span className="font-medium">--</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}