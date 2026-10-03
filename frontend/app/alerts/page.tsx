
// frontend/app/alerts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Alert } from '@/app/services/api';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// Dados MOCK
const MOCK_ALERTS: Alert[] = [
  {
    id: 1,
    group_id: 1,
    group_code: 'GG1',
    type: 'CRITICAL',
    message: 'Temperatura do óleo acima do limite crítico',
    parameter: 'oil_temperature',
    value: 97.5,
    threshold: 95,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    resolved_at: null,
    acknowledged_by: null
  },
  {
    id: 2,
    group_id: 2,
    group_code: 'GG2',
    type: 'WARNING',
    message: 'Pressão do óleo abaixo do ideal',
    parameter: 'oil_pressure',
    value: 3.2,
    threshold: 3.5,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    resolved_at: null,
    acknowledged_by: null
  },
  {
    id: 3,
    group_id: 4,
    group_code: 'GG4',
    type: 'INFO',
    message: 'Manutenção preventiva recomendada em 50 horas',
    parameter: 'running_hours',
    value: 12450,
    threshold: 12000,
    status: 'ACKNOWLEDGED',
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    resolved_at: null,
    acknowledged_by: 'Carlos Manuel'
  },
  {
    id: 4,
    group_id: 7,
    group_code: 'GG7',
    type: 'CRITICAL',
    message: 'Frequência fora do padrão permitido',
    parameter: 'frequency',
    value: 48.2,
    threshold: 49.5,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    resolved_at: null,
    acknowledged_by: null
  },
  {
    id: 5,
    group_id: 8,
    group_code: 'GG8',
    type: 'WARNING',
    message: 'Potência acima de 90% da capacidade nominal',
    parameter: 'active_power',
    value: 2.18,
    threshold: 2.16,
    status: 'RESOLVED',
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    resolved_at: new Date(Date.now() - 90 * 60000).toISOString(),
    acknowledged_by: 'Ana Júlia'
  }
];

const getSeverityColor = (type: Alert['type']) => {
  switch (type) {
    case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
    case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'INFO': return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

const getStatusColor = (status: Alert['status']) => {
  switch (status) {
    case 'ACTIVE': return 'bg-red-500 animate-pulse';
    case 'ACKNOWLEDGED': return 'bg-yellow-500';
    case 'RESOLVED': return 'bg-green-500';
  }
};

const getStatusText = (status: Alert['status']) => {
  switch (status) {
    case 'ACTIVE': return 'Ativo';
    case 'ACKNOWLEDGED': return 'Reconhecido';
    case 'RESOLVED': return 'Resolvido';
  }
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        // Usar MOCK por enquanto
        setTimeout(() => {
          setAlerts(MOCK_ALERTS);
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    loadAlerts();
  }, []);

  const handleAcknowledge = async (alertId: number) => {
    try {
      // await acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'ACKNOWLEDGED', acknowledged_by: 'Você' }
          : alert
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      // await resolveAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'RESOLVED', resolved_at: new Date().toISOString() }
          : alert
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = filter === 'ALL' 
    ? alerts 
    : alerts.filter(alert => alert.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando alertas...</div>
      </div>
    );
  }

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter(a => a.type === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
            <p className="text-gray-600">Monitoramento em tempo real dos grupos geradores</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Ativos:</span>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {activeCount}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Críticos:</span>
              <span className="bg-red-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                {criticalCount}
              </span>
            </div>
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
          Todos
        </button>
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'ACTIVE' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setFilter('ACKNOWLEDGED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'ACKNOWLEDGED' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Reconhecidos
        </button>
        <button
          onClick={() => setFilter('RESOLVED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'RESOLVED' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Resolvidos
        </button>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum alerta encontrado</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`bg-white rounded-lg shadow border-l-4 ${
                alert.type === 'CRITICAL' ? 'border-red-500' :
                alert.type === 'WARNING' ? 'border-yellow-500' :
                'border-blue-500'
              } p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.type)}`}>
                      {alert.type}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${getStatusColor(alert.status)}`}></span>
                    <span className="text-xs text-gray-500">
                      {getStatusText(alert.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {alert.group_code} • {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-medium">{alert.message}</h3>
                  <div className="mt-1 text-sm text-gray-600">
                    <span>Valor: <strong>{alert.value}</strong></span>
                    <span className="mx-2">|</span>
                    <span>Limite: <strong>{alert.threshold}</strong></span>
                    <span className="mx-2">|</span>
                    <span>Parâmetro: <strong>{alert.parameter}</strong></span>
                  </div>
                  {alert.acknowledged_by && (
                    <div className="mt-1 text-xs text-gray-500">
                      Reconhecido por: {alert.acknowledged_by}
                    </div>
                  )}
                  {alert.resolved_at && (
                    <div className="mt-1 text-xs text-gray-500">
                      Resolvido em: {new Date(alert.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                  {alert.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                      >
                        Reconhecer
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Resolver
                      </button>
                    </>
                  )}
                  {alert.status === 'ACKNOWLEDGED' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Resolver
                    </button>
                  )}
                  {alert.status === 'RESOLVED' && (
                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded-lg">
                      Resolvido
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}