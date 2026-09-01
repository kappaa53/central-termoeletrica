
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Incident, getIncidents } from '@/app/services/api';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const getTypeColor = (type: Incident['type']) => {
  switch (type) {
    case 'ELETRICA': return 'bg-purple-100 text-purple-800';
    case 'MECANICA': return 'bg-orange-100 text-orange-800';
    case 'OPERACIONAL': return 'bg-blue-100 text-blue-800';
    case 'SEGURANCA': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getSeverityColor = (severity: Incident['severity']) => {
  switch (severity) {
    case 'CRITICA': return 'bg-red-600 text-white';
    case 'ALTA': return 'bg-orange-500 text-white';
    case 'MEDIA': return 'bg-yellow-500 text-white';
    case 'BAIXA': return 'bg-green-500 text-white';
  }
};

const getStatusColor = (status: Incident['status']) => {
  switch (status) {
    case 'ABERTA': return 'bg-red-100 text-red-800';
    case 'EM_ANALISE': return 'bg-yellow-100 text-yellow-800';
    case 'EM_EXECUCAO': return 'bg-blue-100 text-blue-800';
    case 'RESOLVIDA': return 'bg-green-100 text-green-800';
    case 'FECHADA': return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: Incident['status']) => {
  switch (status) {
    case 'ABERTA': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    case 'EM_ANALISE': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'EM_EXECUCAO': return <ClockIcon className="h-5 w-5 text-blue-500" />;
    case 'RESOLVIDA': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'FECHADA': return <XCircleIcon className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusText = (status: Incident['status']) => {
  switch (status) {
    case 'ABERTA': return 'Aberta';
    case 'EM_ANALISE': return 'Em Análise';
    case 'EM_EXECUCAO': return 'Em Execução';
    case 'RESOLVIDA': return 'Resolvida';
    case 'FECHADA': return 'Fechada';
  }
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ABERTA' | 'EM_ANALISE' | 'EM_EXECUCAO' | 'RESOLVIDA' | 'FECHADA'>('ALL');

  useEffect(() => {
    async function loadIncidents() {
      try {
        setLoading(true);
        const data = await getIncidents();
        setIncidents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadIncidents();
  }, []);

  const filteredIncidents = filter === 'ALL' 
    ? incidents 
    : incidents.filter(inc => inc.status === filter);

  const openCount = incidents.filter(i => i.status === 'ABERTA' || i.status === 'EM_ANALISE' || i.status === 'EM_EXECUCAO').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICA' && i.status !== 'RESOLVIDA' && i.status !== 'FECHADA').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando ocorrências...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
            <p className="text-gray-600">Registro de incidentes e ocorrências operacionais</p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="h-5 w-5" />
            <span>Nova Ocorrência</span>
          </button>
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Abertas:</span>
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {openCount}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Críticas:</span>
            <span className="bg-red-700 text-white px-3 py-1 rounded-full text-sm font-bold">
              {criticalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'ALL' 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('ABERTA')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'ABERTA' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Abertas
        </button>
        <button
          onClick={() => setFilter('EM_ANALISE')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'EM_ANALISE' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Em Análise
        </button>
        <button
          onClick={() => setFilter('EM_EXECUCAO')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'EM_EXECUCAO' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Em Execução
        </button>
        <button
          onClick={() => setFilter('RESOLVIDA')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'RESOLVIDA' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Resolvidas
        </button>
        <button
          onClick={() => setFilter('FECHADA')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'FECHADA' 
              ? 'bg-gray-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Fechadas
        </button>
      </div>

      {/* Lista de Ocorrências */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma ocorrência encontrada</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(incident.type)}`}>
                      {incident.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                      {getStatusText(incident.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {incident.group_code} • {new Date(incident.opened_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{incident.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{incident.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Operador: {incident.operator}
                    {incident.resolved_at && (
                      <span className="ml-4">
                        Resolvido em: {new Date(incident.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusIcon(incident.status)}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}