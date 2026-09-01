
'use client';

import { useEffect, useState } from 'react';
import { Maintenance, getMaintenance } from '@/app/services/api';
import { 
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const getTypeColor = (type: Maintenance['type']) => {
  switch (type) {
    case 'PREVENTIVA': return 'bg-blue-100 text-blue-800';
    case 'CORRETIVA': return 'bg-orange-100 text-orange-800';
    case 'PREDITIVA': return 'bg-purple-100 text-purple-800';
    case 'URGENTE': return 'bg-red-100 text-red-800';
  }
};

const getTypeText = (type: Maintenance['type']) => {
  switch (type) {
    case 'PREVENTIVA': return 'Preventiva';
    case 'CORRETIVA': return 'Corretiva';
    case 'PREDITIVA': return 'Preditiva';
    case 'URGENTE': return 'Urgente';
  }
};

const getPriorityColor = (priority: Maintenance['priority']) => {
  switch (priority) {
    case 'ALTA': return 'bg-red-600 text-white';
    case 'MEDIA': return 'bg-yellow-500 text-white';
    case 'BAIXA': return 'bg-green-500 text-white';
  }
};

const getStatusColor = (status: Maintenance['status']) => {
  switch (status) {
    case 'AGENDADA': return 'bg-blue-100 text-blue-800';
    case 'EM_ANDAMENTO': return 'bg-yellow-100 text-yellow-800';
    case 'CONCLUIDA': return 'bg-green-100 text-green-800';
    case 'CANCELADA': return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: Maintenance['status']) => {
  switch (status) {
    case 'AGENDADA': return <CalendarIcon className="h-5 w-5 text-blue-500" />;
    case 'EM_ANDAMENTO': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'CONCLUIDA': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'CANCELADA': return <XCircleIcon className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusText = (status: Maintenance['status']) => {
  switch (status) {
    case 'AGENDADA': return 'Agendada';
    case 'EM_ANDAMENTO': return 'Em Andamento';
    case 'CONCLUIDA': return 'Concluída';
    case 'CANCELADA': return 'Cancelada';
  }
};

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'>('ALL');

  useEffect(() => {
    async function loadMaintenance() {
      try {
        setLoading(true);
        const data = await getMaintenance();
        setMaintenance(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMaintenance();
  }, []);

  const filteredMaintenance = filter === 'ALL' 
    ? maintenance 
    : maintenance.filter(m => m.status === filter);

  const pendingCount = maintenance.filter(m => m.status === 'AGENDADA' || m.status === 'EM_ANDAMENTO').length;
  const totalCost = maintenance
    .filter(m => m.actual_cost !== null)
    .reduce((sum, m) => sum + (m.actual_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando manutenções...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manutenção</h1>
            <p className="text-gray-600">Planejamento e histórico de manutenções</p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="h-5 w-5" />
            <span>Nova Manutenção</span>
          </button>
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Pendentes:</span>
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {pendingCount}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Custo Total:</span>
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
          onClick={() => setFilter('AGENDADA')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'AGENDADA' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Agendadas
        </button>
        <button
          onClick={() => setFilter('EM_ANDAMENTO')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'EM_ANDAMENTO' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Em Andamento
        </button>
        <button
          onClick={() => setFilter('CONCLUIDA')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'CONCLUIDA' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Concluídas
        </button>
        <button
          onClick={() => setFilter('CANCELADA')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'CANCELADA' 
              ? 'bg-gray-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Canceladas
        </button>
      </div>

      {/* Lista de Manutenções */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMaintenance.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma manutenção encontrada</p>
          </div>
        ) : (
          filteredMaintenance.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                      {getTypeText(item.type)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.group_code}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Técnico:</span> {item.technician}
                    </div>
                    <div>
                      <span className="font-medium">Agendado:</span> {new Date(item.scheduled_date).toLocaleDateString()}
                    </div>
                    {item.completed_date && (
                      <div>
                        <span className="font-medium">Concluído:</span> {new Date(item.completed_date).toLocaleDateString()}
                      </div>
                    )}
                    {item.work_hours && (
                      <div>
                        <span className="font-medium">Horas:</span> {item.work_hours}h
                      </div>
                    )}
                  </div>
                  {(item.estimated_cost || item.actual_cost) && (
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      {item.estimated_cost && (
                        <span className="text-gray-500">
                          <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                          Estimado: {item.estimated_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      )}
                      {item.actual_cost && (
                        <span className="text-green-600 font-medium">
                          Real: {item.actual_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      )}
                    </div>
                  )}
                  {item.notes && (
                    <div className="mt-2 text-sm text-gray-500 border-t pt-2">
                      <span className="font-medium">Observações:</span> {item.notes}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {getStatusIcon(item.status)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}